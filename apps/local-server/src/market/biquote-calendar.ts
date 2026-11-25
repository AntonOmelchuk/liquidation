import { MARKET_IMPACT } from "@liquidation/domain/market/constants";
import type { CalendarEvent } from "@liquidation/domain/market/types";
import { shiftDay } from "@liquidation/domain/workspace/period";
import { z } from "zod";
import {
  BIQUOTE_CALENDAR_COUNTRIES,
  BIQUOTE_CALENDAR_LIMIT,
  BIQUOTE_CALENDAR_URL,
  BIQUOTE_PERCENT,
  BIQUOTE_TIME_EXACT,
  BIQUOTE_VALUE_SUFFIX,
} from "./constants.ts";

const impacts = {
  none: MARKET_IMPACT.LOW,
  low: MARKET_IMPACT.LOW,
  medium: MARKET_IMPACT.MEDIUM,
  high: MARKET_IMPACT.HIGH,
} as const;

const reading = z.number().nullish();
const row = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(300),
  currency: z.string().regex(/^[A-Z]{3}$/),
  time: z.iso.datetime({ offset: true }),
  timeMode: z.string(),
  importance: z.enum(Object.keys(impacts) as (keyof typeof impacts)[]),
  unit: z.string().nullish(),
  multiplier: z.string().nullish(),
  actual: reading,
  forecast: reading,
  previous: reading,
});

const suffix = new Map<string, string>(Object.entries(BIQUOTE_VALUE_SUFFIX));

export function biquoteCalendarUrl(time: number) {
  const day = new Date(time).toISOString().slice(0, 10);
  const url = new URL(BIQUOTE_CALENDAR_URL);
  url.searchParams.set("from", shiftDay(day, -1) + "T00:00:00Z");
  url.searchParams.set("to", shiftDay(day, 2) + "T00:00:00Z");
  url.searchParams.set("countries", BIQUOTE_CALENDAR_COUNTRIES);
  url.searchParams.set("limit", String(BIQUOTE_CALENDAR_LIMIT));
  return url;
}

export function parseBiquoteEvents(payload: unknown): CalendarEvent[] {
  const rows = z.array(z.unknown()).parse(payload);
  const events = new Map<string, CalendarEvent>();
  for (const candidate of rows) {
    const result = row.safeParse(candidate);
    if (!result.success) continue;
    const event = result.data;
    const unit =
      event.unit === BIQUOTE_PERCENT
        ? "%"
        : (suffix.get(event.multiplier ?? "") ?? "");
    const format = (value: number | null | undefined) =>
      value == null ? "" : String(value) + unit;
    events.set(event.id, {
      id: event.id,
      name: event.name,
      currency: event.currency,
      at: new Date(event.time).toISOString(),
      timeKnown: event.timeMode === BIQUOTE_TIME_EXACT,
      impact: impacts[event.importance],
      actual: format(event.actual),
      forecast: format(event.forecast),
      previous: format(event.previous),
    });
  }
  if (rows.length && !events.size) throw new Error("Invalid calendar data.");
  return [...events.values()].sort((a, b) => a.at.localeCompare(b.at));
}
