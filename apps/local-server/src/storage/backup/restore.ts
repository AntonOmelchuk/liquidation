import { randomUUID } from "node:crypto";
import { lstat, rename, rm } from "node:fs/promises";
import { join } from "node:path";
import { FILE_ERROR } from "../../constants.ts";
import { JOURNAL_FILE, SCREENSHOT_DIRECTORY } from "../constants.ts";
import { PREVIOUS_SCREENSHOTS, RESTORE_TRANSACTION } from "./constants.ts";

async function exists(path: string) {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === FILE_ERROR.NOT_FOUND)
      return false;
    throw error;
  }
}

export async function recoverRestore(directory: string) {
  const transaction = join(directory, RESTORE_TRANSACTION);
  if (!(await exists(transaction))) return;
  // The journal is renamed last. Its presence in staging means rollback is needed.
  if (await exists(join(transaction, JOURNAL_FILE))) {
    const liveImages = join(directory, SCREENSHOT_DIRECTORY);
    const nextImages = join(transaction, SCREENSHOT_DIRECTORY);
    const previousImages = join(transaction, PREVIOUS_SCREENSHOTS);
    if (!(await exists(nextImages)) && (await exists(liveImages)))
      await rename(liveImages, nextImages);
    if (await exists(previousImages)) await rename(previousImages, liveImages);
  }
  // Detach the transaction before recursive cleanup so recovery is repeatable.
  const finished = join(directory, `.restore-finished-${randomUUID()}`);
  await rename(transaction, finished);
  await rm(finished, { force: true, recursive: true }).catch((error) =>
    console.error("Could not remove finished backup staging files.", error),
  );
}

export async function installRestore(directory: string, snapshotPath: string) {
  const transaction = join(directory, RESTORE_TRANSACTION);
  const liveImages = join(directory, SCREENSHOT_DIRECTORY);
  await rename(snapshotPath, transaction);
  try {
    if (await exists(liveImages))
      await rename(liveImages, join(transaction, PREVIOUS_SCREENSHOTS));
    await rename(join(transaction, SCREENSHOT_DIRECTORY), liveImages);
    await rename(
      join(transaction, JOURNAL_FILE),
      join(directory, JOURNAL_FILE),
    );
  } catch (error) {
    await recoverRestore(directory);
    throw error;
  }
  await recoverRestore(directory).catch((error) =>
    console.error("Could not clean up the committed restore.", error),
  );
}
