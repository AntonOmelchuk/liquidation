import { PERIOD, QUARTER_MONTHS, WEEK_LENGTH } from "./constants.ts";
import type { ReviewPeriod } from "./types.ts";

const dateKey = (date: Date) => date.toISOString().slice(0, 10);
export const calendarDate = (day: string) => new Date(day + "T12:00:00Z");
export const weekIndex = (date: Date) =>
  (date.getUTCDay() + WEEK_LENGTH - 1) % WEEK_LENGTH;

export function localDay(iso: string) {
  const date = new Date(iso);
  return dateKey(new Date(date.getTime() - date.getTimezoneOffset() * 60_000));
}

export function shiftDay(day: string, days: number) {
  const date = calendarDate(day);
  date.setUTCDate(date.getUTCDate() + days);
  return dateKey(date);
}

export function shiftMonth(month: string, months: number) {
  const date = calendarDate(month + "-01");
  date.setUTCMonth(date.getUTCMonth() + months);
  return dateKey(date).slice(0, 7);
}

export function periodBounds(kind: ReviewPeriod, day: string) {
  const first = calendarDate(day);
  if (kind === PERIOD.WEEK)
    first.setUTCDate(first.getUTCDate() - weekIndex(first));
  if (kind === PERIOD.MONTH || kind === PERIOD.QUARTER) first.setUTCDate(1);
  if (kind === PERIOD.QUARTER)
    first.setUTCMonth(
      Math.floor(first.getUTCMonth() / QUARTER_MONTHS) * QUARTER_MONTHS,
    );

  const last = new Date(first);
  if (kind === PERIOD.WEEK)
    last.setUTCDate(last.getUTCDate() + WEEK_LENGTH - 1);
  if (kind === PERIOD.MONTH || kind === PERIOD.QUARTER) {
    last.setUTCMonth(
      last.getUTCMonth() + (kind === PERIOD.QUARTER ? QUARTER_MONTHS : 1),
      0,
    );
  }
  return { start: dateKey(first), through: dateKey(last) };
}

export function previousPeriod(kind: ReviewPeriod, start: string) {
  return periodBounds(kind, shiftDay(start, -1));
}
