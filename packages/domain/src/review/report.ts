import { HOURS_IN_MS, TRADE_FACTOR } from "../analytics/constants.ts";
import { tradeFactorKeys } from "../analytics/trade-factors.ts";
import { tradeStatistics } from "../analytics/trade-statistics.ts";
import { netCents } from "../trades/trade.ts";
import { tradeAccountKey } from "../trades/trade-tags.ts";
import type { Trade } from "../trades/types.ts";
import { createReviewCalendar, entryWeekday } from "./calendar.ts";
import { REVIEW_BREAK_EVEN_R, REVIEW_GROUP } from "./constants.ts";
import type { ReviewBucket, ReviewQuery, ReviewSource } from "./types.ts";

export function reviewAccountKey(trade: Pick<Trade, "account" | "accountId">) {
  return tradeAccountKey(trade);
}

export function reviewMetrics(trades: readonly Trade[]) {
  const base = tradeStatistics(trades);
  let wins = 0;
  let losses = 0;
  let largestWin = 0;
  let largestLoss = 0;
  let nearBreakEven = 0;
  const fallbackRisk = Math.abs(base.averageLoss ?? 0);

  for (const trade of trades) {
    const result = netCents(trade) / 100;
    const threshold = (trade.risk ?? fallbackRisk) * REVIEW_BREAK_EVEN_R;
    if (result > 0) wins++;
    if (result < 0) losses++;
    largestWin = Math.max(largestWin, result);
    largestLoss = Math.min(largestLoss, result);
    if (result === 0 || Math.abs(result) < threshold) nearBreakEven++;
  }

  return {
    ...base,
    wins,
    losses,
    largestWin: wins ? largestWin : null,
    largestLoss: losses ? largestLoss : null,
    nearBreakEven,
  };
}

function breakdown(
  trades: readonly Trade[],
  keyFor: (trade: Trade) => string,
  describe: (
    key: string,
    sample: Trade,
  ) => Pick<ReviewBucket, "title" | "side"> = (title) => ({ title }),
) {
  return Array.from(Map.groupBy(trades, keyFor), ([key, records]) => ({
    key,
    ...describe(key, records[0]),
    metrics: reviewMetrics(records),
  }));
}

const netFirst = (a: ReviewBucket, b: ReviewBucket) =>
  b.metrics.net - a.metrics.net || a.key.localeCompare(b.key, "en");

const chronological = (a: ReviewBucket, b: ReviewBucket) =>
  a.key.localeCompare(b.key, "en", { numeric: true });

export function holdingHours(trade: Pick<Trade, "closedAt" | "openedAt">) {
  return (
    (Date.parse(trade.closedAt) - Date.parse(trade.openedAt)) / HOURS_IN_MS
  );
}

export function buildReview(
  { trades, positions }: ReviewSource,
  query: ReviewQuery,
) {
  const at = createReviewCalendar(query.timeZone);
  const matchesAccount = (trade: Pick<Trade, "account">) =>
    query.account === undefined || reviewAccountKey(trade) === query.account;
  const calendar = trades
    .filter(matchesAccount)
    .map((trade) => ({ trade, closed: at(trade.closedAt) }))
    .filter(
      ({ closed }) => closed.day >= query.from && closed.day <= query.through,
    )
    .map(({ trade, closed }) => ({
      trade,
      closed,
      opened: at(trade.openedAt),
    }));
  const stamps = new Map(
    calendar.map(({ trade, closed, opened }) => [trade, { closed, opened }]),
  );
  const records = calendar.map(({ trade }) => trade);
  const account = (key: string, sample: Trade) => ({
    title: sample.account ?? key,
  });
  return {
    query,
    records,
    totals: reviewMetrics(records),
    openPositions: positions.filter(matchesAccount).length,
    accounts: breakdown(records, reviewAccountKey, account).sort(netFirst),
    groups: {
      [REVIEW_GROUP.SYMBOLS]: breakdown(records, (trade) => trade.symbol).sort(
        netFirst,
      ),
      [REVIEW_GROUP.SIDES]: breakdown(
        records,
        (trade) => trade.direction,
        (_, trade) => ({ title: "", side: trade.direction }),
      ).sort(chronological),
      [REVIEW_GROUP.SYMBOL_SIDES]: breakdown(
        records,
        (trade) => JSON.stringify([trade.symbol, trade.direction]),
        (_, trade) => ({ title: trade.symbol, side: trade.direction }),
      ).sort(chronological),
      [REVIEW_GROUP.WEEKDAYS]: breakdown(records, (trade) =>
        String(entryWeekday(stamps.get(trade)!.opened.day)),
      ).sort(chronological),
      [REVIEW_GROUP.HOURS]: breakdown(records, (trade) =>
        String(stamps.get(trade)!.opened.hour),
      ).sort(chronological),
      [REVIEW_GROUP.MONTHS]: breakdown(
        records,
        (trade) => stamps.get(trade)!.closed.month,
      ).sort(chronological),
      [REVIEW_GROUP.DURATIONS]: breakdown(
        records,
        (trade) => tradeFactorKeys(trade, TRADE_FACTOR.DURATION)[0],
      ).sort(chronological),
    },
  };
}
