import { tradeStatistics } from "../analytics/trade-statistics.ts";
import type { Trade } from "../trades/types.ts";
import { netCents } from "../trades/trade.ts";
import { PERIOD, WEEK_LENGTH } from "./constants.ts";
import { localDay, periodBounds, shiftDay } from "./period.ts";
import type { ReviewPeriod } from "./types.ts";
import type { ReviewPeriodIndexSource } from "./types.ts";

export function quarterWeeks(day: string) {
  const quarter = periodBounds(PERIOD.QUARTER, day);
  let monday = periodBounds(PERIOD.WEEK, quarter.start).start;
  // Each week belongs to the quarter containing its Thursday.
  if (shiftDay(monday, 3) < quarter.start)
    monday = shiftDay(monday, WEEK_LENGTH);
  const weeks: { start: string; days: string[] }[] = [];
  while (shiftDay(monday, 3) <= quarter.through) {
    weeks.push({
      start: monday,
      days: Array.from({ length: WEEK_LENGTH }, (_, index) =>
        shiftDay(monday, index),
      ),
    });
    monday = shiftDay(monday, WEEK_LENGTH);
  }
  return weeks;
}

function countResults(trades: readonly Trade[]) {
  let net = 0,
    won = 0,
    lost = 0,
    flat = 0;
  for (const trade of trades) {
    const cents = netCents(trade);
    net += cents;
    if (cents > 0) won++;
    else if (cents < 0) lost++;
    else flat++;
  }
  return { net: net / 100, closed: trades.length, won, lost, flat };
}

export function cardIndex(
  source: ReviewPeriodIndexSource,
  day: string,
  dayAt = localDay,
) {
  const byDay = Map.groupBy(source.trades, (trade) => dayAt(trade.closedAt));
  const entriesByDay = Map.groupBy(
    [...source.trades, ...source.positions],
    (trade) => dayAt(trade.openedAt),
  );
  const weekOf = (iso: string) => periodBounds(PERIOD.WEEK, dayAt(iso)).start;
  const byWeek = Map.groupBy(source.trades, (trade) => weekOf(trade.openedAt));
  const pendingByWeek = Map.groupBy(source.positions, (trade) =>
    weekOf(trade.openedAt),
  );
  const reports = new Map(
    source.reports.map((report) => [report.kind + ":" + report.start, report]),
  );
  return quarterWeeks(day).map((week) => ({
    start: week.start,
    days: week.days.map((date) => {
      const stats = countResults(byDay.get(date) ?? []);
      return {
        day: date,
        report: reports.get(PERIOD.DAY + ":" + date),
        ...stats,
        entered: entriesByDay.get(date)?.length ?? 0,
      };
    }),
    weekly: {
      report: reports.get(PERIOD.WEEK + ":" + week.start),
      ...countResults(byWeek.get(week.start) ?? []),
      open: pendingByWeek.get(week.start)?.length ?? 0,
    },
  }));
}

export function reportCoverage(
  source: ReviewPeriodIndexSource,
  period: ReviewPeriod,
  day: string,
  dayAt = localDay,
) {
  const { start, through } = periodBounds(period, day);
  const entries = new Set(
    [...source.trades, ...source.positions]
      .map((trade) => dayAt(trade.openedAt))
      .filter((date) => date >= start && date <= through),
  );
  const written = new Set(
    source.reports
      .filter(
        (report) => report.kind === PERIOD.DAY && entries.has(report.start),
      )
      .map((report) => report.start),
  );
  return {
    tradingDays: entries.size,
    reviewedDays: written.size,
    missingDays: [...entries].filter((date) => !written.has(date)).sort(),
  };
}

export function reportIndex(
  source: ReviewPeriodIndexSource,
  today: string,
  dayAt = localDay,
) {
  const monthKeys = new Set([periodBounds(PERIOD.MONTH, today).start]);
  for (const trade of source.trades)
    monthKeys.add(periodBounds(PERIOD.MONTH, dayAt(trade.closedAt)).start);
  for (const report of source.reports) {
    if (report.kind === PERIOD.MONTH || report.kind === PERIOD.QUARTER)
      monthKeys.add(periodBounds(PERIOD.MONTH, report.start).start);
  }
  const quarters = new Set(
    [...monthKeys].map((day) => periodBounds(PERIOD.QUARTER, day).start),
  );
  const rows = (kind: ReviewPeriod, start: string) => {
    const { through } = periodBounds(kind, start);
    const trades = source.trades.filter((trade) => {
      const day = dayAt(trade.closedAt);
      return day >= start && day <= through;
    });
    return {
      kind,
      start,
      through,
      report: source.reports.find(
        (record) => record.kind === kind && record.start === start,
      ),
      metrics: tradeStatistics(trades),
      coverage: reportCoverage(source, kind, start, dayAt),
    };
  };
  return [...quarters]
    .sort((a, b) => b.localeCompare(a))
    .map((start) => ({
      quarter: rows(PERIOD.QUARTER, start),
      months: [...monthKeys]
        .filter((day) => periodBounds(PERIOD.QUARTER, day).start === start)
        .sort((a, b) => b.localeCompare(a))
        .map((day) => rows(PERIOD.MONTH, day)),
    }));
}
