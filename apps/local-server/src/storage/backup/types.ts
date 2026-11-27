import type { BackupSummary } from "@liquidation/domain/backup/types";
import type { StoredJournal } from "@liquidation/domain/journal/types";
import type { createScreenshotStorage } from "../screenshot-storage.ts";

export type ReadScreenshot = ReturnType<typeof createScreenshotStorage>["read"];
export type JournalBackupOptions = {
  directory: string;
  exclusive: <Result>(operation: () => Promise<Result>) => Promise<Result>;
  read: () => Promise<StoredJournal>;
  readScreenshot: ReadScreenshot;
};
export type BackupDownload = {
  path: string;
  filename: string;
  dispose?: () => Promise<void>;
};
export type PreparedBackup = {
  snapshotPath: string;
  journal: StoredJournal;
  summary: BackupSummary;
};
export type BackupCandidate = PreparedBackup & {
  token: string;
  directory: string;
  fingerprint: string;
  expiration: ReturnType<typeof setTimeout>;
};
