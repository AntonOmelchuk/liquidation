import { PLAN_STATUS } from "../plans/constants.ts";
import { getPlanVoiding } from "../plans/plan-lifecycle.ts";
import { mistakeKeys, reviewedMistakes } from "../trades/mistakes.ts";
import { netCents } from "../trades/trade.ts";
import { PERIOD, WATCH_OUTCOME } from "./constants.ts";
import { localDay, periodBounds } from "./period.ts";
import { isBreakevenReviewReason } from "./planning.ts";
import type {
  WatchlistActivityIndex,
  WatchlistActivitySource,
  WeeklyWatchlist,
} from "./types.ts";

export function indexWatchlistActivity(
  source: WatchlistActivitySource,
  dayAt = localDay,
): WatchlistActivityIndex {
  const weekOf = (iso: string) => periodBounds(PERIOD.WEEK, dayAt(iso)).start;
  return {
    trades: Map.groupBy(source.trades, ({ openedAt }) => weekOf(openedAt)),
    positions: Map.groupBy(source.positions, ({ openedAt }) =>
      weekOf(openedAt),
    ),
    missedTrades: Map.groupBy(
      source.missedTrades.filter(
        ({ reason }) => !isBreakevenReviewReason(reason),
      ),
      ({ missedAt }) => weekOf(missedAt),
    ),
    plans: new Map(
      source.plans
        .filter((plan) => !getPlanVoiding(plan))
        .map((plan) => [plan.id, plan]),
    ),
  };
}

export function watchlistSummary(
  entry: WeeklyWatchlist,
  activity: WatchlistActivityIndex,
) {
  const { items, start } = entry;
  const symbols = new Set(items.map(({ symbol }) => symbol));
  const watched = <T extends { symbol: string }>(records: readonly T[] = []) =>
    records.filter(({ symbol }) => symbols.has(symbol));

  const trades = watched(activity.trades.get(start));
  const positions = watched(activity.positions.get(start));
  const missedTrades = watched(activity.missedTrades.get(start));
  const linked = new Set(items.flatMap(({ planIds }) => planIds));
  let worked = 0;
  let failed = 0;
  for (const id of linked) {
    const status = activity.plans.get(id)?.review.status;
    if (
      status === PLAN_STATUS.WORKED ||
      status === PLAN_STATUS.WORKED_WITHOUT_ENTRY
    )
      worked++;
    if (status === PLAN_STATUS.FAILED) failed++;
  }

  return {
    closedBySymbol: Map.groupBy(trades, ({ symbol }) => symbol),
    openBySymbol: Map.groupBy(positions, ({ symbol }) => symbol),
    missedBySymbol: Map.groupBy(missedTrades, ({ symbol }) => symbol),
    reviewedAssets: items.filter(
      ({ outcome }) => outcome !== WATCH_OUTCOME.PENDING,
    ).length,
    missedAssets: items.filter(
      ({ outcome }) => outcome === WATCH_OUTCOME.MISSED,
    ).length,
    worked,
    decided: worked + failed,
    missedCount: missedTrades.length,
    mistakes: trades.some(reviewedMistakes)
      ? trades.reduce((total, trade) => total + mistakeKeys(trade).length, 0)
      : null,
    net: trades.length
      ? trades.reduce((total, trade) => total + netCents(trade), 0) / 100
      : null,
  };
}
