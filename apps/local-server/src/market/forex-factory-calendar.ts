import { MARKET_IMPACT } from "@liquidation/domain/market/constants";
import type { CalendarEvent } from "@liquidation/domain/market/types";
import { z } from "zod";

const HOLIDAY = "Holiday";
const ALL_DAY = "All Day";
const TENTATIVE = "Tentative";
const impact = {
  Low: MARKET_IMPACT.LOW,
  Medium: MARKET_IMPACT.MEDIUM,
  High: MARKET_IMPACT.HIGH,
  [HOLIDAY]: MARKET_IMPACT.LOW,
} as const;

const row = z.object({
  title: z.string().trim().min(1).max(300),
  country: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/),
  date: z.iso.datetime({ offset: true }),
  time: z.string().nullish(),
  impact: z.enum(Object.keys(impact) as (keyof typeof impact)[]),
  actual: z.string().nullish(),
  forecast: z.string().nullish(),
  previous: z.string().nullish(),
});

const rows = z.array(z.unknown());

export function parseForexFactoryEvents(payload: unknown) {
  const input = rows.parse(payload);
  const events = new Map<string, CalendarEvent>();
  for (const value of input) {
    const result = row.safeParse(value);
    if (!result.success) continue;
    const event = result.data;
    const timestamp = Date.parse(event.date);
    if (!Number.isFinite(timestamp)) continue;
    const at = new Date(timestamp).toISOString();
    const allDay = event.impact === HOLIDAY || event.time === ALL_DAY;
    const id = JSON.stringify([event.country, at, event.title]);
    events.set(id, {
      id,
      name: event.title,
      currency: event.country,
      at,
      timeKnown: !allDay && event.time !== TENTATIVE,
      allDayOn: allDay ? event.date.slice(0, 10) : undefined,
      impact: impact[event.impact],
      actual: allDay ? "" : (event.actual ?? ""),
      forecast: allDay ? "" : (event.forecast ?? ""),
      previous: allDay ? "" : (event.previous ?? ""),
    });
  }
  if (input.length && !events.size) throw new Error("Invalid calendar data.");
  return [...events.values()].sort((a, b) => a.at.localeCompare(b.at));
}
