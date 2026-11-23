import type {
  TradeFactor,
  TradeFactorFilters,
  TradeStatistics,
} from "@liquidation/domain/analytics/types";
import type { Trade } from "@liquidation/domain/trades/types";

import type { DateRange } from "../../shared/analytics/types.ts";
import type { useLocale } from "../../shared/messages.ts";
import type { TRADE_COLUMN } from "./constants.ts";
import type { useStatisticsMessages } from "./messages.ts";

export type FactorLabel = (factor: TradeFactor, key: string) => string;
export type TradeColumn = (typeof TRADE_COLUMN)[keyof typeof TRADE_COLUMN];
export type TradeBreakdownFiltersProps = {
  trades: readonly Trade[];
  dates: DateRange;
  filters: TradeFactorFilters;
  invalidDates: boolean;
  labelFor: FactorLabel;
  onDates: (dates: DateRange) => void;
  onFilter: (factor: TradeFactor, value: string | undefined) => void;
  onReset: () => void;
};
export type StatisticsMessages = ReturnType<typeof useStatisticsMessages>;
export type CommonMessages = ReturnType<typeof useLocale>["t"];

export type StatisticsSummaryProps = { metrics: TradeStatistics };
