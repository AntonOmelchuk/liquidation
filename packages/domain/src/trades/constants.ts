export const TRADE_SIDE = { LONG: "long", SHORT: "short" } as const;
export const POSITION_ACTION = {
  OPEN: "open",
  EDIT: "edit",
  CLOSE: "close",
} as const;

export const TRADE_SESSION = {
  ASIA: "AKZ",
  PRE_LONDON: "PreLKZ",
  LONDON: "LKZ",
  NEW_YORK: "NYKZ",
  AM: "AMKZ",
  PM: "PMKZ",
  OUTSIDE: "Out of KZ",
} as const;

export const ENTRY_TYPE = {
  MARKET: "market",
  LIMIT: "limit",
  STOP: "stop",
} as const;
export const TRADE_TAG_LIMITS = {
  account: 80,
  style: 80,
  mistake: 80,
  mistakes: 10,
} as const;

export const MISTAKE_PRESET = {
  EARLY_ENTRY: "Early entry",
  LATE_ENTRY: "Late entry",
  NO_SETUP: "No valid setup",
  OUTSIDE_PLAN: "Outside trading plan",
  FOMO: "FOMO",
  REVENGE: "Revenge trading",
  OVERTRADING: "Overtrading",
  EXCESS_RISK: "Excess risk",
  MOVED_STOP: "Moved stop away",
  EARLY_EXIT: "Early exit",
  MISSED_EXIT: "Missed planned exit",
  NEWS: "Ignored news",
  SESSION: "Outside trading session",
  RULE_VIOLATION: "Rule violation",
} as const;
