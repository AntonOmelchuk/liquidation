import { netCents } from "../trades/trade.ts";
import type { Trade } from "../trades/types.ts";
import { createReviewCalendar } from "./calendar.ts";
import { ENTRY_HOUR_SIDE, REVIEW_RULE } from "./constants.ts";
import { holdingHours, reviewAccountKey, reviewMetrics } from "./report.ts";
import type { ReviewCalendar, ReviewReport, ReviewRule } from "./types.ts";

function byOpen(a: Trade, b: Trade) {
  return (
    Date.parse(a.openedAt) - Date.parse(b.openedAt) || a.id.localeCompare(b.id)
  );
}
function byClose(a: Trade, b: Trade) {
  return Date.parse(a.closedAt) - Date.parse(b.closedAt) || byOpen(a, b);
}
function dayAccount(trade: Trade, day: string) {
  return JSON.stringify([reviewAccountKey(trade), day]);
}

function stopAfterDailyLoss(records: readonly Trade[], at: ReviewCalendar) {
  const closed = records.filter((trade) => netCents(trade) < 0).sort(byClose);
  const entered = new Set<Trade>();
  const stopped = new Set<string>();
  let cursor = 0;
  for (const trade of records.toSorted(byOpen)) {
    const openTime = Date.parse(trade.openedAt);
    // An equal timestamp does not establish whether the loss was already known.
    while (
      cursor < closed.length &&
      Date.parse(closed[cursor].closedAt) < openTime
    ) {
      const loss = closed[cursor++];
      if (entered.has(loss))
        stopped.add(dayAccount(loss, at(loss.closedAt).day));
    }
    if (!stopped.has(dayAccount(trade, at(trade.openedAt).day)))
      entered.add(trade);
  }
  return entered;
}

function afterLosingStreak(records: readonly Trade[]) {
  const closed = records.toSorted(byClose);
  const streaks = new Map<string, number>();
  const entered = new Set<Trade>();
  let cursor = 0;
  for (const trade of records.toSorted(byOpen)) {
    const openTime = Date.parse(trade.openedAt);
    while (
      cursor < closed.length &&
      Date.parse(closed[cursor].closedAt) < openTime
    ) {
      const settled = closed[cursor++];
      const account = reviewAccountKey(settled);
      streaks.set(
        account,
        netCents(settled) < 0 ? (streaks.get(account) ?? 0) + 1 : 0,
      );
    }
    if ((streaks.get(reviewAccountKey(trade)) ?? 0) >= 2) entered.add(trade);
  }
  return entered;
}

export function simulateReview(report: ReviewReport, rule: ReviewRule) {
  const { records, query, totals } = report;
  const at = createReviewCalendar(query.timeZone);
  let retained: ReadonlySet<Trade>;
  switch (rule.kind) {
    case REVIEW_RULE.SYMBOLS:
      retained = new Set(
        records.filter((trade) => rule.symbols.includes(trade.symbol)),
      );
      break;
    case REVIEW_RULE.ENTRY_HOUR:
      retained = new Set(
        records.filter((trade) => {
          const hour = at(trade.openedAt).hour;
          return rule.side === ENTRY_HOUR_SIDE.BEFORE
            ? hour < rule.hour
            : hour >= rule.hour;
        }),
      );
      break;
    case REVIEW_RULE.MINIMUM_HOLD:
      retained = new Set(
        records.filter((trade) => holdingHours(trade) >= rule.hours),
      );
      break;
    case REVIEW_RULE.DAILY_LOSS:
      retained = stopAfterDailyLoss(records, at);
      break;
    case REVIEW_RULE.LOSING_STREAK:
      retained = afterLosingStreak(records);
      break;
  }
  return {
    before: totals,
    after: reviewMetrics(records.filter((trade) => retained.has(trade))),
    excluded: records.filter((trade) => !retained.has(trade)).sort(byClose),
  };
}
