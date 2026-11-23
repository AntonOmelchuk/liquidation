import { JOURNAL_VERSION } from "@liquidation/domain/journal/constants";
import { journalSchema } from "@liquidation/domain/journal/journal";
import type { Journal } from "@liquidation/domain/journal/types";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { FILE_ERROR } from "../constants.ts";
import { createScreenshotStorage } from "./screenshot-storage.ts";

export function createJournalStorage(directory: string) {
  const path = join(directory, "journal.json");
  const screenshots = createScreenshotStorage(directory);
  let pending: Promise<unknown> = Promise.resolve();

  async function read() {
    try {
      return journalSchema.parse(JSON.parse(await readFile(path, "utf8")));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== FILE_ERROR.NOT_FOUND)
        throw error;
      return journalSchema.parse({ version: JOURNAL_VERSION, trades: [] });
    }
  }

  function write<Result>(
    mutate: (journal: Journal) => Result,
    uploads?: ReadonlyMap<string, Uint8Array>,
  ) {
    const operation = pending.then(async () => {
      const journal = await read();
      const result = mutate(journal);
      await mkdir(directory, { recursive: true, mode: 0o700 });
      const temporary = join(directory, `.journal-${randomUUID()}.tmp`);
      const rollback = uploads && (await screenshots.write(uploads));
      try {
        await writeFile(temporary, JSON.stringify(journal, null, 2), {
          flag: "wx",
          mode: 0o600,
          flush: true,
        });
        await rename(temporary, path);
      } catch (error) {
        await rollback?.();
        await rm(temporary, { force: true }).catch(() => undefined);
        throw error;
      }
      return result;
    });
    pending = operation.catch(() => undefined);
    return operation;
  }

  return { read, write, readScreenshot: screenshots.read };
}
