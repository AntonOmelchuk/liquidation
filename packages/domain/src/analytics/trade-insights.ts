import type { Trade } from "../trades/types.ts";
import {
  INSIGHT_ACTION,
  INSIGHT_FACTORS,
  INSIGHT_MIN_SAMPLE,
} from "./constants.ts";
import { tradeBreakdown, tradeFactorKeys } from "./trade-factors.ts";
import { tradeStatistics } from "./trade-statistics.ts";
import type { InsightAction, InsightRule, TradeInsight } from "./types.ts";

export function tradeInsights(trades: readonly Trade[]): TradeInsight[] {
  return INSIGHT_FACTORS.flatMap((factor) =>
    tradeBreakdown(trades, factor)
      .filter(
        ({ key, metrics }) =>
          Boolean(key) && metrics.count > 0 && metrics.net !== 0,
      )
      .map((row) => ({
        ...row,
        factor,
        sufficient: row.metrics.count >= INSIGHT_MIN_SAMPLE,
      })),
  );
}

export function simulateInsights(
  trades: readonly Trade[],
  rules: readonly InsightRule[],
  action: InsightAction,
) {
  const kept: Trade[] = [];
  const excluded: Trade[] = [];
  for (const trade of trades) {
    const matches = rules.some(({ factor, key }) =>
      tradeFactorKeys(trade, factor).includes(key),
    );
    const keep = action === INSIGHT_ACTION.INCLUDE ? matches : !matches;
    (keep ? kept : excluded).push(trade);
  }
  return {
    kept,
    excluded,
    actual: tradeStatistics(trades),
    scenario: tradeStatistics(kept),
  };
}
