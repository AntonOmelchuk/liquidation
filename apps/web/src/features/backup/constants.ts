export const BACKUP_TASK = {
  PREVIEW: "preview",
  RESTORE: "restore",
} as const;

export const BACKUP_ERROR = {
  INVALID: "invalid",
  LARGE: "tooLarge",
  CONFLICT: "conflict",
  FAILED: "failed",
} as const;

export const BACKUP_COUNTS = [
  "accounts",
  "trades",
  "positions",
  "plans",
  "playbooks",
  "backtests",
  "learning",
  "newsReactions",
  "screenshots",
  "trash",
] as const;
