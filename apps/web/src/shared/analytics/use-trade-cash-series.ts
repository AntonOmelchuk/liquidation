import { tradeCurves } from "@liquidation/domain/analytics/trade-risk";
import type { Trade } from "@liquidation/domain/trades/types";
import { useMemo } from "react";

export function useTradeCashSeries(trades: readonly Trade[]) {
  return useMemo(
    () =>
      trades.length
        ? [0, ...tradeCurves(trades).cash.map(({ value }) => value)]
        : [],
    [trades],
  );
}
