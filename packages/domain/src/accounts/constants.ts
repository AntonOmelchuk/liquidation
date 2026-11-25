export const ACCOUNT_KIND = {
  BROKER: "broker",
  PROP: "prop",
  DEMO: "demo",
} as const;

export const ACCOUNT_RECORD = {
  ACCOUNT: "account",
  MOVEMENT: "movement",
} as const;

export const MOVEMENT_KIND = {
  DEPOSIT: "deposit",
  WITHDRAWAL: "withdrawal",
  FEE: "fee",
  CORRECTION: "correction",
} as const;

export const LIMIT_UNIT = {
  MONEY: "money",
  PERCENT: "percent",
} as const;

export const MAX_LOSS_MODE = {
  STATIC: "static",
  TRAILING: "trailing",
  TRAILING_TO_START: "trailing-to-start",
} as const;

export const DEFAULT_CURRENCY = "USD";
export const MAX_ACCOUNT_NAME_LENGTH = 80;
export const MAX_ACCOUNT_TEXT_LENGTH = 4000;
export const DEFAULT_FIRM_DAY_START = "00:00";
export const DEFAULT_ACCOUNT_TIME_ZONE = "UTC";
