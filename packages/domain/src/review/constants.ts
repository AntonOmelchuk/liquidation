export const REVIEW_PERIOD = {
  WEEK: "week",
  MONTH: "month",
  QUARTER: "quarter",
  CUSTOM: "custom",
} as const;

export const REVIEW_DAYS = {
  [REVIEW_PERIOD.WEEK]: 7,
  [REVIEW_PERIOD.MONTH]: 30,
  [REVIEW_PERIOD.QUARTER]: 90,
} as const;

export const REVIEW_GROUP = {
  SYMBOLS: "symbols",
  SIDES: "sides",
  SYMBOL_SIDES: "symbolSides",
  WEEKDAYS: "weekdays",
  HOURS: "hours",
  MONTHS: "months",
  DURATIONS: "durations",
} as const;

export const REVIEW_RULE = {
  SYMBOLS: "symbols",
  ENTRY_HOUR: "entryHour",
  MINIMUM_HOLD: "minimumHold",
  DAILY_LOSS: "dailyLoss",
  LOSING_STREAK: "losingStreak",
} as const;

export const ENTRY_HOUR_SIDE = { BEFORE: "before", AFTER: "after" } as const;
export const REVIEW_MODEL_STATUS = {
  READY: "ready",
  DISABLED: "disabled",
  EMPTY: "empty",
  UNAVAILABLE: "unavailable",
  BUSY: "busy",
  INVALID: "invalid",
} as const;

export const REVIEW_SMALL_SAMPLE = 20;
export const REVIEW_BREAK_EVEN_R = 0.1;
export const REVIEW_EXCLUSION_LIMIT = 15;
export const REVIEW_INSIGHT_LIMIT = 5;
