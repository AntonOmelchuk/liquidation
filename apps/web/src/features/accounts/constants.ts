export const LEGACY_ACCOUNT_OPTION = "@legacy";
export const ACCOUNT_LIMIT_FIELDS = [
  "dailyLimit",
  "maxLoss",
  "target",
] as const;
export const ACCOUNT_SAVE_ERROR = {
  INVALID: "invalid",
  CONFLICT: "conflict",
  SAVE: "saveError",
} as const;
