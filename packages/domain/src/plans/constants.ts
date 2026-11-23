export const PLAN_STATUS = {
  WAITING: "waiting",
  IN_PROGRESS: "in-progress",
  WORKED: "worked",
  FAILED: "failed",
  MISSED: "missed",
} as const;
export const PLAN_STATUSES = Object.values(PLAN_STATUS);

export const PLAN_NARRATIVE = {
  BULLISH: "bullish",
  BEARISH: "bearish",
  NEUTRAL: "neutral",
  NO_TRADE: "no-trade",
} as const;
export const PLAN_NARRATIVES = Object.values(PLAN_NARRATIVE);

export const PLAN_EVENT = {
  UPDATE: "update",
  VOID: "void",
  RESTORE: "restore",
} as const;
export const PLAN_ACTION = {
  CREATE: "create",
  EDIT: "edit",
  ADD_UPDATE: "add-update",
  EDIT_UPDATE: "edit-update",
  VOID: PLAN_EVENT.VOID,
  RESTORE: PLAN_EVENT.RESTORE,
} as const;

export const PLAN_PERIOD = { CURRENT: "current", PAST: "past" } as const;
export const MAX_PLAN_ANALYSIS_BLOCKS = 16;
