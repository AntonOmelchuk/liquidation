import type { Trade } from "../trades/types.ts";
import { localDay, periodBounds } from "../workspace/period.ts";
import { STAT_PERIOD } from "./constants.ts";
import { tradeStatistics } from "./trade-statistics.ts";
import type { StatisticsPeriod } from "./types.ts";

export function periodStatistics(
  trades: readonly Trade[],
  period: StatisticsPeriod,
  dayAt = localDay,
) {
  const groups = Map.groupBy(trades, (trade) => {
    const day = dayAt(trade.closedAt);
    return period === STAT_PERIOD.YEAR
      ? day.slice(0, 4)
      : periodBounds(period, day).start;
  });
  return [...groups]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, records]) => ({
      key,
      records,
      metrics: tradeStatistics(records),
    }));
}
