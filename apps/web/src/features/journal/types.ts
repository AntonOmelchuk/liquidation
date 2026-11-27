import type { Trade } from "@liquidation/domain/trades/types";

export type JournalUnavailableProps = {
  backHref: string;
  backLabel: string;
  missing: string;
  loadError?: string;
};

export type PerformanceChartProps = { values: readonly number[] };

export type InstrumentBreakdownProps = { trades: readonly Trade[] };

export type TradeFilters = {
  query: string;
  account?: string;
  side: string;
  from: string;
  through: string;
};
