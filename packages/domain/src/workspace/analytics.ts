import { netCents } from "../trades/trade.ts";
import type { Position, Trade } from "../trades/types.ts";
import { PERIOD, RECENT_TRADE_COUNT, WEEK_LENGTH } from "./constants.ts";
import {
  calendarDate,
  localDay,
  periodBounds,
  shiftDay,
  weekIndex,
} from "./period.ts";
import type { ReviewPeriod } from "./types.ts";

export function newestTrades(trades: readonly Trade[]) {
  return trades.toSorted(
    (a, b) =>
      Date.parse(b.closedAt) - Date.parse(a.closedAt) ||
      Date.parse(b.openedAt) - Date.parse(a.openedAt) ||
      a.id.localeCompare(b.id),
  );
}

export function reviewTrades(
  trades: readonly Trade[],
  kind: ReviewPeriod,
  day: string,
  dayAt = localDay,
) {
  const { start, through } = periodBounds(kind, day);
  return trades.filter((trade) => {
    const eventDay = dayAt(
      kind === PERIOD.WEEK ? trade.openedAt : trade.closedAt,
    );
    return eventDay >= start && eventDay <= through;
  });
}

export function assessmentCandidates(
  trades: readonly Trade[],
  positions: readonly Position[],
  kind: ReviewPeriod,
  day: string,
  dayAt = localDay,
) {
  if (kind !== PERIOD.DAY && kind !== PERIOD.WEEK)
    return reviewTrades(trades, kind, day, dayAt);
  const { start, through } = periodBounds(kind, day);
  return [
    ...trades.filter(
      ({ openedAt, closedAt }) =>
        dayAt(openedAt) <= through && dayAt(closedAt) >= start,
    ),
    ...positions.filter(({ openedAt }) => dayAt(openedAt) <= through),
  ];
}

export function recentTradeReview(trades: readonly Trade[]) {
  const sorted = newestTrades(trades);
  const current = sorted.slice(0, RECENT_TRADE_COUNT);
  const previous = sorted.slice(RECENT_TRADE_COUNT, RECENT_TRADE_COUNT * 2);
  return {
    current,
    previous,
  };
}

export function calendarMonth(
  trades: readonly Trade[],
  month: string,
  dayAt = localDay,
) {
  const { start, through } = periodBounds(PERIOD.MONTH, month + "-01");
  const days = new Map<
    string,
    { trades: Trade[]; net: number; wins: number }
  >();
  for (const trade of trades) {
    const day = dayAt(trade.closedAt);
    if (day < start || day > through) continue;
    const aggregate = days.get(day) ?? { trades: [], net: 0, wins: 0 };
    const net = netCents(trade);
    aggregate.trades.push(trade);
    aggregate.net += net;
    aggregate.wins += Number(net > 0);
    days.set(day, aggregate);
  }

  const first = shiftDay(start, -weekIndex(calendarDate(start)));
  const weekCount = Math.ceil(
    (weekIndex(calendarDate(start)) + calendarDate(through).getUTCDate()) /
      WEEK_LENGTH,
  );
  const weeks = Array.from({ length: weekCount }, (_, week) => {
    const dates = Array.from({ length: WEEK_LENGTH }, (_, weekday) =>
      shiftDay(first, week * WEEK_LENGTH + weekday),
    );
    const active = dates.flatMap((date) => {
      const day = days.get(date);
      return day ? [day] : [];
    });
    return {
      dates,
      net: active.reduce((sum, { net }) => sum + net, 0),
      active: active.length,
    };
  });
  return {
    days,
    weeks,
    net: weeks.reduce((sum, week) => sum + week.net, 0),
    active: days.size,
  };
}
