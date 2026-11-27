import { JOURNAL_VERSION } from "@liquidation/domain/journal/constants";
import { storedJournalSchema } from "@liquidation/domain/journal/journal";
import type { Journal, StoredJournal } from "@liquidation/domain/journal/types";
import type { ReleaseObservation } from "@liquidation/domain/market/types";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { FILE_ERROR } from "../constants.ts";
import { mergeReleaseObservations } from "../market/merge-reactions.ts";
import { createJournalBackup } from "./backup/service.ts";
import { recoverRestore } from "./backup/restore.ts";
import { JOURNAL_FILE } from "./constants.ts";
import { splitJournalSnapshot } from "./journal-snapshot.ts";
import { createScreenshotStorage } from "./screenshot-storage.ts";
import { journalScreenshotIds } from "../records/screenshot-references.ts";

export function createJournalStorage(directory: string) {
  const path = join(directory, JOURNAL_FILE);
  const screenshots = createScreenshotStorage(directory);
  let pending: Promise<unknown> = Promise.resolve();

  async function readSnapshot() {
    try {
      return storedJournalSchema.parse(
        JSON.parse(await readFile(path, "utf8")),
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== FILE_ERROR.NOT_FOUND)
        throw error;
      return storedJournalSchema.parse({
        version: JOURNAL_VERSION,
        trades: [],
      });
    }
  }

  function exclusive<Result>(operation: () => Promise<Result>) {
    const next = pending.then(async () => {
      await recoverRestore(directory);
      return operation();
    });
    pending = next.catch(() => undefined);
    return next;
  }

  async function writeSnapshot(snapshot: StoredJournal) {
    await mkdir(directory, { recursive: true, mode: 0o700 });
    const temporary = join(directory, `.journal-${randomUUID()}.tmp`);
    try {
      await writeFile(temporary, JSON.stringify(snapshot, null, 2), {
        flag: "wx",
        mode: 0o600,
        flush: true,
      });
      await rename(temporary, path);
    } catch (error) {
      await rm(temporary, { force: true }).catch(() => undefined);
      throw error;
    }
  }

  function write<Result>(
    mutate: (journal: Journal) => Result,
    uploads?: ReadonlyMap<string, Uint8Array>,
    purgeScreenshots = false,
  ) {
    return exclusive(async () => {
      const { records: journal, releaseObservations } = splitJournalSnapshot(
        await readSnapshot(),
      );
      const before = purgeScreenshots
        ? journalScreenshotIds(journal)
        : undefined;
      const result = mutate(journal);
      const rollback = uploads && (await screenshots.write(uploads));
      try {
        await writeSnapshot({ ...journal, releaseObservations });
      } catch (error) {
        await rollback?.();
        throw error;
      }
      if (before) {
        const after = journalScreenshotIds(journal);
        await screenshots
          .remove([...before].filter((id) => !after.has(id)))
          .catch((error) =>
            console.error(
              "Could not remove unreferenced screenshots after deleting the record.",
              error,
            ),
          );
      }
      return result;
    });
  }

  return {
    read: () =>
      exclusive(async () => splitJournalSnapshot(await readSnapshot()).records),
    write,
    readReleaseHistory: () =>
      exclusive(async () => (await readSnapshot()).releaseObservations),
    recordReleaseHistory: (updates: readonly ReleaseObservation[]) =>
      exclusive(async () => {
        const snapshot = await readSnapshot();
        const history = mergeReleaseObservations(
          snapshot.releaseObservations,
          updates,
        );
        if (history !== snapshot.releaseObservations)
          await writeSnapshot({ ...snapshot, releaseObservations: history });
      }),
    readScreenshot: (id: string) => exclusive(() => screenshots.read(id)),
    backup: createJournalBackup({
      directory,
      exclusive,
      read: readSnapshot,
      readScreenshot: screenshots.read,
    }),
  };
}
