import type { Playbook } from "@liquidation/domain/playbooks/types";
import type { useTradeGroupSelection } from "./group-selection.tsx";
import type {
  TradeFactor,
  TradeFactorFilters,
  TradeStatistics,
} from "@liquidation/domain/analytics/types";
import type { Trade } from "@liquidation/domain/trades/types";

import type { DateRange } from "../../shared/analytics/types.ts";
import type { useLocale } from "../../shared/messages.ts";
import type {
  STATISTICS_VIEW,
  TRADE_COLUMN,
  TRADE_LEDGER_SORT,
} from "./constants.ts";
import type { useStatisticsMessages } from "./messages.ts";

export type FactorLabel = (factor: TradeFactor, key: string) => string;
export type TradeColumn = (typeof TRADE_COLUMN)[keyof typeof TRADE_COLUMN];
export type StatisticsView =
  (typeof STATISTICS_VIEW)[keyof typeof STATISTICS_VIEW];
export type FactorSelection = { factor: TradeFactor; key: string };
export type AccountBalance = { openingBalance: number; balance: number };
export type AccountBalances = ReadonlyMap<string, AccountBalance>;
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

export type StatisticsSummaryProps = {
  metrics: TradeStatistics;
  trades: readonly Trade[];
};

export type TradeAnalysisProps = { trades: readonly Trade[] };

export type GroupSelection = ReturnType<typeof useTradeGroupSelection>;
export type GroupSelectionProps = { selection: GroupSelection };
export type GroupCheckboxProps = GroupSelectionProps & {
  groupKey: string;
  label: string;
};

export type StatisticsTradeSort =
  (typeof TRADE_LEDGER_SORT)[keyof typeof TRADE_LEDGER_SORT];

export type StatisticsTradesTableProps = TradeAnalysisProps & {
  labelFor: FactorLabel;
  playbooks: readonly Playbook[];
};
