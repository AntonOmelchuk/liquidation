import type {
  InsightAction,
  InsightRule,
  TradeInsight,
} from "@liquidation/domain/analytics/types";
import type { Trade } from "@liquidation/domain/trades/types";
import type { FactorLabel } from "../types.ts";
import type { INSIGHT_COLUMN } from "./constants.ts";

export type InsightColumn =
  (typeof INSIGHT_COLUMN)[keyof typeof INSIGHT_COLUMN];
export type InsightScenario = { action: InsightAction; rules: InsightRule[] };
export type InsightReportProps = {
  trades: readonly Trade[];
  labelFor: FactorLabel;
};
export type InsightTableProps = {
  rows: readonly TradeInsight[];
  action: InsightAction;
  labelFor: FactorLabel;
  onSimulate: (scenario: InsightScenario) => void;
};
