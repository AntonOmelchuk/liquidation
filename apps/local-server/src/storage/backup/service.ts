import { MAX_BACKUP_BYTES } from "@liquidation/domain/backup/constants";
import { backupSelectionSchema } from "@liquidation/domain/backup/contracts";
import type { BackupPreview } from "@liquidation/domain/backup/types";
import { HTTP_STATUS } from "@liquidation/domain/journal/constants";
import type { StoredJournal } from "@liquidation/domain/journal/types";
import { createHash, randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, mkdtemp, rename, rm, stat } from "node:fs/promises";
import { join } from "node:path";
import { Transform } from "node:stream";
import type { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { FILE_ERROR } from "../../constants.ts";
import { JournalConflict, RequestError } from "../../errors.ts";
import { splitJournalSnapshot } from "../journal-snapshot.ts";
import {
  backupTooLarge,
  unpackBackupArchive,
  writeBackupArchive,
} from "./archive.ts";
import {
  BACKUP_DIRECTORY,
  BACKUP_PREVIEW_LIFETIME,
  BACKUP_WORK_DIRECTORY,
} from "./constants.ts";
import { installRestore } from "./restore.ts";
import type {
  BackupCandidate,
  BackupDownload,
  JournalBackupOptions,
} from "./types.ts";

function fingerprint(journal: StoredJournal) {
  return createHash("sha256")
    .update(JSON.stringify(splitJournalSnapshot(journal).records))
    .digest("hex");
}

async function removeDirectory(path: string) {
  await rm(path, { force: true, recursive: true }).catch((error) =>
    console.error("Could not remove backup staging files.", error),
  );
}

async function receiveArchive(input: Readable, path: string) {
  let size = 0;
  await pipeline(
    input,
    new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        size += chunk.length;
        if (size > MAX_BACKUP_BYTES) callback(backupTooLarge());
        else callback(undefined, chunk);
      },
    }),
    createWriteStream(path, { flags: "wx", mode: 0o600 }),
  );
}

export function createJournalBackup({
  directory,
  exclusive,
  read,
  readScreenshot,
}: JournalBackupOptions) {
  const work = join(directory, BACKUP_WORK_DIRECTORY);
  const safetyDirectory = join(directory, BACKUP_DIRECTORY);
  let candidate: BackupCandidate | undefined;
  let busy = false;

  async function staging(prefix: string) {
    await mkdir(work, { recursive: true, mode: 0o700 });
    return mkdtemp(join(work, prefix));
  }

  async function cancel(token: string) {
    const selected = candidate;
    if (selected?.token !== token) return;
    candidate = undefined;
    clearTimeout(selected.expiration);
    await removeDirectory(selected.directory);
  }

  function download(): Promise<BackupDownload> {
    return exclusive(async () => {
      const folder = await staging("export-");
      const path = join(folder, "journal.zip");
      const createdAt = new Date().toISOString();
      try {
        await writeBackupArchive(path, await read(), readScreenshot, createdAt);
        return {
          path,
          filename: "liquidation-" + createdAt.replaceAll(":", "-") + ".zip",
          dispose: () => removeDirectory(folder),
        };
      } catch (error) {
        await removeDirectory(folder);
        throw error;
      }
    });
  }

  async function preview(input: Readable): Promise<BackupPreview> {
    if (busy)
      throw new JournalConflict("Another backup operation is in progress.");
    busy = true;
    let folder: string | undefined;
    try {
      if (candidate) await cancel(candidate.token);
      folder = await staging("preview-");
      const upload = join(folder, "upload.zip");
      await receiveArchive(input, upload);
      const snapshot = await unpackBackupArchive(
        upload,
        join(folder, "snapshot"),
      );
      await rm(upload);
      const original = await exclusive(async () => fingerprint(await read()));
      const token = randomUUID();
      candidate = {
        ...snapshot,
        token,
        directory: folder,
        fingerprint: original,
        expiration: setTimeout(
          () => void cancel(token),
          BACKUP_PREVIEW_LIFETIME,
        ).unref(),
      };
      return { token, summary: snapshot.summary };
    } catch (error) {
      if (folder) await removeDirectory(folder);
      throw error;
    } finally {
      busy = false;
    }
  }

  function safetyFile(id: string): BackupDownload {
    const filename = "liquidation-before-restore-" + id + ".zip";
    return { path: join(safetyDirectory, filename), filename };
  }

  async function safety(token: string): Promise<BackupDownload> {
    if (!backupSelectionSchema.shape.token.safeParse(token).success)
      throw new RequestError(HTTP_STATUS.NOT_FOUND, "Backup not found.");
    const file = safetyFile(token);
    try {
      await stat(file.path);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === FILE_ERROR.NOT_FOUND)
        throw new RequestError(HTTP_STATUS.NOT_FOUND, "Backup not found.");
      throw error;
    }
    return file;
  }

  async function restore(token: string) {
    if (busy)
      throw new JournalConflict("Another backup operation is in progress.");
    const selected = candidate;
    if (selected?.token !== token)
      throw new JournalConflict("The backup preview has expired.");
    busy = true;
    candidate = undefined;
    clearTimeout(selected.expiration);
    try {
      return await exclusive(async () => {
        const current = await read();
        if (fingerprint(current) !== selected.fingerprint)
          throw new JournalConflict(
            "The journal changed after the backup preview.",
          );

        const safetyId = randomUUID();
        await mkdir(safetyDirectory, { recursive: true, mode: 0o700 });
        const temporary = join(safetyDirectory, `.${safetyId}.tmp`);
        try {
          await writeBackupArchive(
            temporary,
            current,
            readScreenshot,
            new Date().toISOString(),
          );
          await rename(temporary, safetyFile(safetyId).path);
        } catch (error) {
          await rm(temporary, { force: true }).catch(() => undefined);
          throw error;
        }
        await installRestore(directory, selected.snapshotPath);
        return {
          journal: splitJournalSnapshot(selected.journal).records,
          safetyId,
        };
      });
    } finally {
      await removeDirectory(selected.directory);
      busy = false;
    }
  }

  return { download, preview, restore, cancel, safety };
}
