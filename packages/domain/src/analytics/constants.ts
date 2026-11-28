export const TRADE_FACTOR = {
  INSTRUMENT: "instrument",
  SIDE: "direction",
  TIMEFRAME: "timeframe",
  WEEKDAY: "weekday",
  HOUR: "hour",
  MONTH: "month",
  YEAR: "year",
  PLAYBOOK: "model",
  SETUP: "setup",
  DURATION: "duration",
  OUTCOME: "outcome",
  ACCOUNT: "account",
  STYLE: "style",
  SESSION: "session",
  ENTRY_TYPE: "entryType",
  LIMIT_ENTRY_TEST: "limitEntryTest",
  MISTAKE: "mistake",
} as const;

export const TRADE_OUTCOME = {
  WIN: "win",
  LOSS: "loss",
  FLAT: "flat",
} as const;

export const HOLD_TIME = {
  UNDER_4H: "1",
  FROM_4_TO_12H: "2",
  FROM_12_TO_24H: "3",
  FROM_24_TO_72H: "4",
  OVER_72H: "5",
} as const;

export const HOURS_IN_MS = 60 * 60 * 1000;

export const PLAN_GROUPING = {
  COMBINED: "instrumentAndPlaybook",
  INSTRUMENT: "instrument",
  PLAYBOOK: "playbook",
  SIDE: "direction",
} as const;
export const PLAN_ANALYTICS_GROUPINGS = Object.values(PLAN_GROUPING);

export const SCENARIO_UNIT = { R: "r", CASH: "cash" } as const;

export const R_BUCKET = {
  BELOW_MINUS_TWO: "belowMinusTwo",
  MINUS_TWO_TO_MINUS_ONE: "minusTwoToMinusOne",
  MINUS_ONE_TO_ZERO: "minusOneToZero",
  ZERO: "zero",
  ZERO_TO_ONE: "zeroToOne",
  ONE_TO_TWO: "oneToTwo",
  ABOVE_TWO: "aboveTwo",
} as const;

export const STOP_OVERRUN_R = 1.2;
export const STAT_PERIOD = {
  DAY: "day",
  WEEK: "week",
  MONTH: "month",
  QUARTER: "quarter",
  YEAR: "year",
} as const;

export const MISTAKE_PERIOD = {
  DAY: "day",
  WEEKDAY: "weekday",
  MONTH: "month",
} as const;
export const MISTAKE_TREND = {
  INCREASED: "increased",
  DECREASED: "decreased",
  STABLE: "stable",
  UNKNOWN: "noComparison",
} as const;
export const MISTAKE_TREND_SAMPLE = 20;
export const INSIGHT_MIN_SAMPLE = 20;
export const INSIGHT_ACTION = {
  INCLUDE: "include",
  EXCLUDE: "exclude",
} as const;
export const INSIGHT_FACTORS = [
  TRADE_FACTOR.INSTRUMENT,
  TRADE_FACTOR.SIDE,
  TRADE_FACTOR.ACCOUNT,
  TRADE_FACTOR.WEEKDAY,
  TRADE_FACTOR.SESSION,
  TRADE_FACTOR.TIMEFRAME,
  TRADE_FACTOR.HOUR,
  TRADE_FACTOR.MONTH,
  TRADE_FACTOR.YEAR,
  TRADE_FACTOR.ENTRY_TYPE,
  TRADE_FACTOR.DURATION,
  TRADE_FACTOR.STYLE,
  TRADE_FACTOR.PLAYBOOK,
  TRADE_FACTOR.SETUP,
] as const;
