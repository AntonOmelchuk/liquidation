import { currencies } from "../instruments/constants.ts";
import { localDay } from "../workspace/period.ts";
import {
  CHINESE_YUAN,
  MARKET_IMPACT,
  METAL_CODES,
  NEWS_CURRENCY_BY_SYMBOL,
  NEWS_REMINDER_WINDOW_MS,
  OFFSHORE_YUAN,
} from "./constants.ts";
import type { CalendarEvent } from "./types.ts";

function newsCurrency(code: string) {
  return code === OFFSHORE_YUAN ? CHINESE_YUAN : code;
}

export function instrumentNewsCurrencies(instrument: string) {
  const symbol = instrument
    .trim()
    .toUpperCase()
    .split(/[._]/u, 1)[0]
    .replaceAll(/[ /-]/gu, "");
  const mapped = NEWS_CURRENCY_BY_SYMBOL.get(symbol);
  if (mapped) return [mapped];
  if (Object.hasOwn(currencies, symbol)) return [newsCurrency(symbol)];
  if (symbol.length !== 6) return [];

  const [base, quote] = [symbol.slice(0, 3), symbol.slice(3)];
  if (!Object.hasOwn(currencies, quote)) return [];
  if (METAL_CODES.has(base)) return [newsCurrency(quote)];
  if (!Object.hasOwn(currencies, base) || base === quote) return [];
  return [...new Set([newsCurrency(base), newsCurrency(quote)])];
}

export function scheduledReleaseTime({
  at,
  timeKnown,
  allDayOn,
}: CalendarEvent) {
  return timeKnown && !allDayOn ? Date.parse(at) : null;
}

export function dueNewsReminders(
  events: readonly CalendarEvent[],
  now: number,
) {
  const reminders = new Map<number, CalendarEvent[]>();
  for (const event of events) {
    const time = scheduledReleaseTime(event);
    if (
      event.impact !== MARKET_IMPACT.HIGH ||
      time === null ||
      time <= now ||
      time - now > NEWS_REMINDER_WINDOW_MS
    )
      continue;
    const group = reminders.get(time);
    if (group) group.push(event);
    else reminders.set(time, [event]);
  }
  return reminders;
}

export function upcomingNewsToday(
  events: readonly CalendarEvent[],
  now: number,
  today: string,
) {
  const upcoming = events.filter((event) => {
    if (
      event.impact !== MARKET_IMPACT.HIGH ||
      (event.allDayOn ?? localDay(event.at)) !== today
    )
      return false;
    const at = scheduledReleaseTime(event);
    return at === null || at > now;
  });
  return Map.groupBy(upcoming, ({ currency }) => newsCurrency(currency));
}
