import type {
  TradeFactor,
  TradeFactorFilters,
  TradeStatistics,
} from "@liquidation/domain/analytics/types";
import type { Trade } from "@liquidation/domain/trades/types";
import type {
  AccountBalances,
  FactorLabel,
  FactorSelection,
} from "../types.ts";

export type TradeBreakdownProps = {
  factor: TradeFactor;
  onFactor: (factor: TradeFactor) => void;
  trades: readonly Trade[];
  totals: TradeStatistics;
  labelFor: FactorLabel;
  selected: string | null;
  onSelect: (key: string | null) => void;
};

export type TradeBreakdownTableProps = {
  factor: TradeFactor;
  trades: readonly Trade[];
  totals: TradeStatistics;
  labelFor: FactorLabel;
  selected: string | null;
  onSelect: (key: string | null) => void;
  compact?: boolean;
  knownKeys?: readonly string[];
  balances?: AccountBalances;
};

export type StatisticsOverviewProps = {
  trades: readonly Trade[];
  totals: TradeStatistics;
  filters: TradeFactorFilters;
  balances: AccountBalances;
  labelFor: FactorLabel;
  selected: FactorSelection | null;
  onSelect: (selection: FactorSelection | null) => void;
};
