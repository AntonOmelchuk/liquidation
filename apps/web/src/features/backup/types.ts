import type { BACKUP_ERROR, BACKUP_TASK } from "./constants.ts";

export type BackupTask = (typeof BACKUP_TASK)[keyof typeof BACKUP_TASK];
export type BackupError = (typeof BACKUP_ERROR)[keyof typeof BACKUP_ERROR];
