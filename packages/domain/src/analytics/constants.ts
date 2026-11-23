export const TRADE_FACTOR = {
  INSTRUMENT: "instrument",
  SIDE: "direction",
  TIMEFRAME: "timeframe",
  WEEKDAY: "weekday",
  HOUR: "hour",
  MONTH: "month",
  YEAR: "year",
  PLAYBOOK: "model",
  VERSION: "version",
  SETUP: "setup",
  DURATION: "duration",
  OUTCOME: "outcome",
  ACCOUNT: "account",
  SESSION: "session",
  ENTRY_TYPE: "entryType",
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
