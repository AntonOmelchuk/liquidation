import { TRADE_FACTOR } from "@liquidation/domain/analytics/constants";
import {
  ENTRY_TYPE,
  TRADE_SESSION,
  TRADE_SIDE,
} from "@liquidation/domain/trades/constants";
import type { TradeFactor } from "@liquidation/domain/analytics/types";

export const FACTOR_SECTIONS = {
  execution: [
    TRADE_FACTOR.INSTRUMENT,
    TRADE_FACTOR.SIDE,
    TRADE_FACTOR.ACCOUNT,
    TRADE_FACTOR.OUTCOME,
    TRADE_FACTOR.ENTRY_TYPE,
    TRADE_FACTOR.MISTAKE,
  ],
  timing: [
    TRADE_FACTOR.TIMEFRAME,
    TRADE_FACTOR.WEEKDAY,
    TRADE_FACTOR.HOUR,
    TRADE_FACTOR.MONTH,
    TRADE_FACTOR.YEAR,
    TRADE_FACTOR.SESSION,
    TRADE_FACTOR.DURATION,
  ],
  strategy: [
    TRADE_FACTOR.STYLE,
    TRADE_FACTOR.PLAYBOOK,
    TRADE_FACTOR.VERSION,
    TRADE_FACTOR.SETUP,
  ],
} as const;

export const STATISTICS_VIEW = {
  OVERVIEW: "overview",
  BREAKDOWN: "breakdown",
  INSIGHTS: "insights",
} as const;
export const OVERVIEW_SECTIONS = {
  execution: [
    TRADE_FACTOR.ACCOUNT,
    TRADE_FACTOR.INSTRUMENT,
    TRADE_FACTOR.SIDE,
    TRADE_FACTOR.ENTRY_TYPE,
  ],
  timing: [
    TRADE_FACTOR.SESSION,
    TRADE_FACTOR.WEEKDAY,
    TRADE_FACTOR.TIMEFRAME,
    TRADE_FACTOR.MONTH,
    TRADE_FACTOR.YEAR,
  ],
  strategy: [TRADE_FACTOR.SETUP, TRADE_FACTOR.PLAYBOOK, TRADE_FACTOR.STYLE],
} as const;

export const KNOWN_FACTOR_KEYS: Partial<
  Record<TradeFactor, readonly string[]>
> = {
  [TRADE_FACTOR.SIDE]: Object.values(TRADE_SIDE),
  [TRADE_FACTOR.SESSION]: Object.values(TRADE_SESSION),
  [TRADE_FACTOR.WEEKDAY]: Array.from({ length: 7 }, (_, index) =>
    String(index + 1),
  ),
  [TRADE_FACTOR.ENTRY_TYPE]: Object.values(ENTRY_TYPE),
  [TRADE_FACTOR.MONTH]: Array.from({ length: 12 }, (_, index) =>
    String(index + 1).padStart(2, "0"),
  ),
};

export const TRADE_COLUMN = {
  GROUP: "key",
  OPENING: "openingBalance",
  BALANCE: "balance",
  COUNT: "count",
  WIN_RATE: "winRate",
  NET: "net",
  PROFIT_FACTOR: "profitFactor",
  PAYOFF: "payoff",
  EXPECTANCY: "expectancy",
  TOTAL_R: "totalR",
} as const;

export const COMPACT_TRADE_COLUMNS = [
  TRADE_COLUMN.GROUP,
  TRADE_COLUMN.COUNT,
  TRADE_COLUMN.WIN_RATE,
  TRADE_COLUMN.NET,
  TRADE_COLUMN.PAYOFF,
  TRADE_COLUMN.TOTAL_R,
] as const;
export const ACCOUNT_TRADE_COLUMNS = [
  TRADE_COLUMN.GROUP,
  TRADE_COLUMN.OPENING,
  TRADE_COLUMN.BALANCE,
  TRADE_COLUMN.COUNT,
  TRADE_COLUMN.WIN_RATE,
  TRADE_COLUMN.NET,
  TRADE_COLUMN.PAYOFF,
] as const;
export const FULL_TRADE_COLUMNS = [
  TRADE_COLUMN.GROUP,
  TRADE_COLUMN.COUNT,
  TRADE_COLUMN.WIN_RATE,
  TRADE_COLUMN.NET,
  TRADE_COLUMN.PROFIT_FACTOR,
  TRADE_COLUMN.PAYOFF,
  TRADE_COLUMN.EXPECTANCY,
  TRADE_COLUMN.TOTAL_R,
] as const;

export const CHRONOLOGICAL_FACTORS: ReadonlySet<TradeFactor> = new Set([
  TRADE_FACTOR.WEEKDAY,
  TRADE_FACTOR.HOUR,
  TRADE_FACTOR.MONTH,
  TRADE_FACTOR.YEAR,
  TRADE_FACTOR.DURATION,
]);
