import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  MAX_BACKUP_BYTES,
} from "@liquidation/domain/backup/constants";
import { backupManifestSchema } from "@liquidation/domain/backup/contracts";
import { MAX_SCREENSHOT_BYTES } from "@liquidation/domain/evidence/constants";
import { screenshotIdSchema } from "@liquidation/domain/evidence/screenshots";
import { HTTP_STATUS } from "@liquidation/domain/journal/constants";
import { storedJournalSchema } from "@liquidation/domain/journal/journal";
import type { StoredJournal } from "@liquidation/domain/journal/types";
import {
  BlobReader,
  Uint8ArrayReader,
  ZipReader,
  ZipWriter,
} from "@zip.js/zip.js";
import type { FileEntry } from "@zip.js/zip.js";
import { createWriteStream, openAsBlob } from "node:fs";
import { mkdir, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Writable } from "node:stream";
import { finished } from "node:stream/promises";
import { RequestError } from "../../errors.ts";
import { journalScreenshotIds } from "../../records/screenshot-references.ts";
import { JOURNAL_FILE, SCREENSHOT_DIRECTORY } from "../constants.ts";
import { validateScreenshotBytes } from "../screenshot-storage.ts";
import {
  BACKUP_MANIFEST_FILE,
  MAX_BACKUP_ENTRIES,
  MAX_JOURNAL_BYTES,
  MAX_MANIFEST_BYTES,
} from "./constants.ts";
import type { PreparedBackup, ReadScreenshot } from "./types.ts";

const invalidArchive = () =>
  new RequestError(
    HTTP_STATUS.UNPROCESSABLE_CONTENT,
    "Invalid Liquidation backup.",
  );
export const backupTooLarge = () =>
  new RequestError(HTTP_STATUS.CONTENT_TOO_LARGE, "The backup is too large.");

export async function writeBackupArchive(
  path: string,
  journal: StoredJournal,
  readScreenshot: ReadScreenshot,
  createdAt: string,
) {
  const journalBytes = Buffer.from(JSON.stringify(journal));
  const screenshotIds = journalScreenshotIds(journal);
  if (
    journalBytes.length > MAX_JOURNAL_BYTES ||
    screenshotIds.size + 2 > MAX_BACKUP_ENTRIES
  )
    throw backupTooLarge();

  const output = createWriteStream(path, {
    flags: "wx",
    mode: 0o600,
    flush: true,
  });
  const done = finished(output);
  void done.catch(() => undefined);
  try {
    const zip = new ZipWriter(Writable.toWeb(output), { useWebWorkers: false });
    await zip.add(JOURNAL_FILE, new Uint8ArrayReader(journalBytes));
    const missingScreenshots: string[] = [];
    let totalBytes = journalBytes.length;
    for (const id of screenshotIds) {
      const image = await readScreenshot(id);
      if (!image || image.bytes.length > MAX_SCREENSHOT_BYTES) {
        missingScreenshots.push(id);
        continue;
      }
      totalBytes += image.bytes.length;
      if (totalBytes > MAX_BACKUP_BYTES) throw backupTooLarge();
      await zip.add(
        SCREENSHOT_DIRECTORY + "/" + id,
        new Uint8ArrayReader(image.bytes),
        { level: 0 },
      );
    }
    const manifest = Buffer.from(
      JSON.stringify({
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        createdAt,
        missingScreenshots,
      }),
    );
    if (totalBytes + manifest.length > MAX_BACKUP_BYTES) throw backupTooLarge();
    await zip.add(BACKUP_MANIFEST_FILE, new Uint8ArrayReader(manifest));
    await zip.close();
    await done;
    if ((await stat(path)).size > MAX_BACKUP_BYTES) throw backupTooLarge();
  } catch (error) {
    output.destroy();
    await done.catch(() => undefined);
    throw error;
  }
}

async function readEntry(entry: FileEntry | undefined, limit: number) {
  if (!entry) throw invalidArchive();
  if (entry.uncompressedSize > limit) throw backupTooLarge();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    await entry.getData(
      new WritableStream<Uint8Array>({
        write(chunk) {
          length += chunk.length;
          if (length > limit || length > entry.uncompressedSize)
            throw invalidArchive();
          chunks.push(chunk);
        },
      }),
      { checkSignature: true, checkOverlappingEntry: true },
    );
  } catch {
    throw invalidArchive();
  }
  if (length !== entry.uncompressedSize) throw invalidArchive();
  return Buffer.concat(chunks, length);
}

function parseJson(bytes: Buffer): unknown {
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch {
    throw invalidArchive();
  }
}

export async function unpackBackupArchive(
  path: string,
  snapshotPath: string,
): Promise<PreparedBackup> {
  const blob = await openAsBlob(path);
  if (blob.size > MAX_BACKUP_BYTES) throw backupTooLarge();
  const reader = new ZipReader(new BlobReader(blob), { useWebWorkers: false });
  try {
    const entries = new Map<string, FileEntry>();
    let totalBytes = 0;
    try {
      for await (const entry of reader.getEntriesGenerator()) {
        if (
          entry.directory ||
          entry.encrypted ||
          entries.has(entry.filename) ||
          !Number.isSafeInteger(entry.uncompressedSize) ||
          entry.uncompressedSize < 0
        )
          throw invalidArchive();
        totalBytes += entry.uncompressedSize;
        if (totalBytes > MAX_BACKUP_BYTES || entries.size >= MAX_BACKUP_ENTRIES)
          throw backupTooLarge();
        entries.set(entry.filename, entry);
      }
    } catch (error) {
      if (error instanceof RequestError) throw error;
      throw invalidArchive();
    }
    const manifest = backupManifestSchema.safeParse(
      parseJson(
        await readEntry(entries.get(BACKUP_MANIFEST_FILE), MAX_MANIFEST_BYTES),
      ),
    );
    if (!manifest.success) throw invalidArchive();
    const journal = storedJournalSchema.safeParse(
      parseJson(await readEntry(entries.get(JOURNAL_FILE), MAX_JOURNAL_BYTES)),
    );
    if (!journal.success) throw invalidArchive();
    const expected = journalScreenshotIds(journal.data);
    for (const id of manifest.data.missingScreenshots)
      if (!expected.delete(id)) throw invalidArchive();
    if (entries.size !== expected.size + 2) throw invalidArchive();
    const screenshots = join(snapshotPath, SCREENSHOT_DIRECTORY);
    await mkdir(screenshots, { recursive: true, mode: 0o700 });
    for (const id of expected) {
      const name = SCREENSHOT_DIRECTORY + "/" + screenshotIdSchema.parse(id);
      const bytes = validateScreenshotBytes(
        await readEntry(entries.get(name), MAX_SCREENSHOT_BYTES),
      );
      await writeFile(join(snapshotPath, name), bytes, {
        flag: "wx",
        mode: 0o600,
        flush: true,
      });
    }
    const data = journal.data;
    await writeFile(
      join(snapshotPath, JOURNAL_FILE),
      JSON.stringify(data, null, 2),
      {
        flag: "wx",
        mode: 0o600,
        flush: true,
      },
    );
    return {
      snapshotPath,
      journal: data,
      summary: {
        createdAt: manifest.data.createdAt,
        currency: data.currency,
        accounts: data.accounts.length,
        trades: data.trades.length,
        positions: data.positions.length,
        plans: data.plans.length,
        playbooks: data.playbooks.length,
        backtests: data.backtests.length,
        learning: data.workspace.learning.length,
        newsReactions: data.releaseObservations.length,
        screenshots: expected.size,
        missingScreenshots: manifest.data.missingScreenshots.length,
        trash: data.trash.length,
      },
    };
  } finally {
    await reader.close();
  }
}
