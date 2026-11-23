import type { DateRange } from "./types.ts";

export function invalidDateRange({ from, through }: DateRange) {
  return Boolean(from && through && from > through);
}

export function closingPeriod({ from, through }: DateRange) {
  const start = from ? new Date(`${from}T00:00:00`).getTime() : -Infinity;
  const endDay = through ? new Date(`${through}T00:00:00`) : null;
  // Advance in local calendar days so DST does not exclude or include extra trades.
  const end = endDay ? endDay.setDate(endDay.getDate() + 1) : Infinity;
  return { start, end };
}
