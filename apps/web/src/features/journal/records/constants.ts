import { POSITION_ACTION } from "@liquidation/domain/trades/constants";
export const TRADE_PRICE_FIELDS = [
  "entry",
  "stop",
  "target",
  "exit",
  "favorable",
  "adverse",
] as const;
export const PRICE_FIELD_LABEL = {
  entry: "entryPrice",
  stop: "stopPrice",
  target: "targetPrice",
  exit: "exitPrice",
  favorable: "favorablePrice",
  adverse: "adversePrice",
} as const;

export const TRADE_TABLE_MODE = {
  CLOSED: "closed",
  OPEN: "open",
  MIXED: "mixed",
} as const;
export const TRADE_GROUPING = {
  ALL: "all",
  WEEK: "week",
  MONTH: "month",
  QUARTER: "quarter",
} as const;
export const TRADE_RESULT = {
  WIN: "win",
  LOSS: "loss",
  FLAT: "flat",
  OPEN: "open",
  BE: "be",
} as const;

export const TRADE_EDITOR_MODE = {
  RECORD: "record",
  ...POSITION_ACTION,
} as const;
