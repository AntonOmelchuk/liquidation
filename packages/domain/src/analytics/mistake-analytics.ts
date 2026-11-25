import { mistakeKeys, reviewedMistakes } from "../trades/mistakes.ts";
import { tradeTagKey } from "../trades/trade-tags.ts";
import { netCents } from "../trades/trade.ts";
import type { Trade } from "../trades/types.ts";
import { fromCents } from "../shared/money.ts";
import { localDay } from "../workspace/period.ts";
import {
  MISTAKE_PERIOD,
  MISTAKE_TREND,
  MISTAKE_TREND_SAMPLE,
  TRADE_FACTOR,
} from "./constants.ts";
import { tradeFactorKeys } from "./trade-factors.ts";
import type {
  MistakePeriod,
  MistakePeriodRow,
  MistakeRow,
  MistakeSample,
  MistakeTrend,
} from "./types.ts";

function sample(trades: readonly Trade[], key: string): MistakeSample {
  const occurrences = trades.filter((trade) =>
    mistakeKeys(trade).includes(key),
  ).length;
  return {
    count: trades.length,
    occurrences,
    rate: trades.length ? occurrences / trades.length : null,
  };
}

function trend(recent: MistakeSample, previous: MistakeSample): MistakeTrend {
  if (recent.rate === null || previous.rate === null)
    return MISTAKE_TREND.UNKNOWN;
  if (recent.rate > previous.rate) return MISTAKE_TREND.INCREASED;
  if (recent.rate < previous.rate) return MISTAKE_TREND.DECREASED;
  return MISTAKE_TREND.STABLE;
}

export function mistakeAnalytics(trades: readonly Trade[]) {
  const reviewed = trades
    .filter(reviewedMistakes)
    .toSorted(
      (a, b) =>
        Date.parse(b.closedAt) - Date.parse(a.closedAt) ||
        a.id.localeCompare(b.id),
    );
  const recent = reviewed.slice(0, MISTAKE_TREND_SAMPLE);
  const previous = reviewed.slice(
    MISTAKE_TREND_SAMPLE,
    MISTAKE_TREND_SAMPLE * 2,
  );
  const labels = new Map<string, string>();
  const groups = new Map<string, Trade[]>();
  for (const trade of reviewed) {
    for (const label of trade.mistakes ?? []) {
      const key = tradeTagKey(label);
      if (!labels.has(key)) labels.set(key, label);
    }
    for (const key of mistakeKeys(trade)) {
      const records = groups.get(key);
      if (records) records.push(trade);
      else groups.set(key, [trade]);
    }
  }
  const rows = [...groups]
    .map(([key, records]): MistakeRow => {
      const latest = sample(recent, key);
      const earlier = sample(previous, key);
      return {
        key,
        label: labels.get(key) ?? key,
        records,
        count: records.length,
        criticalCount: records.filter((trade) =>
          (trade.criticalMistakes ?? []).some(
            (label) => tradeTagKey(label) === key,
          ),
        ).length,
        net: fromCents(
          records.reduce((sum, trade) => sum + netCents(trade), 0),
        ),
        losses: fromCents(
          records.reduce((sum, trade) => sum + Math.min(0, netCents(trade)), 0),
        ),
        rate: records.length / reviewed.length,
        recent: latest,
        previous: earlier,
        trend: trend(latest, earlier),
      };
    })
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
  return {
    closed: trades.length,
    reviewed: reviewed.length,
    affected: reviewed.filter((trade) => mistakeKeys(trade).length > 0).length,
    critical: reviewed.filter((trade) => trade.criticalMistakes?.length).length,
    occurrences: rows.reduce((sum, row) => sum + row.count, 0),
    criticalOccurrences: rows.reduce((sum, row) => sum + row.criticalCount, 0),
    recurring: rows.filter((row) => row.count > 1).length,
    recentCount: recent.length,
    previousCount: previous.length,
    rows,
  };
}

export function mistakePeriods(
  trades: readonly Trade[],
  period: MistakePeriod,
  focus?: string,
) {
  const groups = Map.groupBy(trades, (trade) => {
    if (period === MISTAKE_PERIOD.WEEKDAY)
      return tradeFactorKeys(trade, TRADE_FACTOR.WEEKDAY)[0];
    const day = localDay(trade.closedAt);
    return period === MISTAKE_PERIOD.MONTH ? day.slice(0, 7) : day;
  });
  return [...groups]
    .map(([key, entries]): MistakePeriodRow => {
      const reviewed = entries.filter(reviewedMistakes);
      const matchingKeys = (trade: Trade) =>
        mistakeKeys(trade).filter(
          (tag) => focus === undefined || tag === focus,
        );
      const records = reviewed.filter(
        (trade) => matchingKeys(trade).length > 0,
      );
      return {
        key,
        closed: entries.length,
        reviewed: reviewed.length,
        affected: records.length,
        occurrences: records.reduce(
          (sum, trade) => sum + matchingKeys(trade).length,
          0,
        ),
        criticalOccurrences: records.reduce((sum, trade) => {
          const critical = new Set(
            (trade.criticalMistakes ?? []).map(tradeTagKey),
          );
          return (
            sum + matchingKeys(trade).filter((tag) => critical.has(tag)).length
          );
        }, 0),
        rate: reviewed.length ? records.length / reviewed.length : null,
        records,
      };
    })
    .sort((a, b) =>
      period === MISTAKE_PERIOD.WEEKDAY
        ? a.key.localeCompare(b.key)
        : b.key.localeCompare(a.key),
    );
}
