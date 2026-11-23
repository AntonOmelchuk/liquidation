import type {
  TradeFactor,
  TradeStatistics,
} from "@liquidation/domain/analytics/types";
import type { Trade } from "@liquidation/domain/trades/types";
import type { FactorLabel } from "../types.ts";

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
};
