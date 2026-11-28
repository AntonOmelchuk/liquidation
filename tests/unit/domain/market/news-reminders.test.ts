import { MARKET_IMPACT, MINUTE_MS } from "@liquidation/domain/market/constants";
import {
  dueNewsReminders,
  instrumentNewsCurrencies,
  upcomingNewsToday,
} from "@liquidation/domain/market/news-reminders";
import type { CalendarEvent } from "@liquidation/domain/market/types";
import { localDay } from "@liquidation/domain/workspace/period";
import { describe, expect, it } from "vitest";

const now = new Date(2026, 10, 27, 12).getTime();
const today = localDay(new Date(now).toISOString());

function release(
  id: string,
  minutes: number,
  changes: Partial<CalendarEvent> = {},
): CalendarEvent {
  return {
    id,
    name: "CPI",
    currency: "USD",
    at: new Date(now + minutes * MINUTE_MS).toISOString(),
    impact: MARKET_IMPACT.HIGH,
    timeKnown: true,
    actual: "",
    forecast: "",
    previous: "",
    ...changes,
  };
}

describe("news reminders", () => {
  it("groups simultaneous high-impact timed releases once inside the window", () => {
    const releases = [
      release("before-window", 16),
      release("border", 15),
      release("same-time", 15, { currency: "EUR" }),
      release("inside", 8),
      release("already-due", 0),
      release("past", -1),
      release("medium", 15, { impact: MARKET_IMPACT.MEDIUM }),
      release("tentative", 15, { timeKnown: false }),
      release("all-day", 15, { allDayOn: today }),
    ];
    expect(
      [...dueNewsReminders(releases, now)].map(([at, events]) => [
        (at - now) / MINUTE_MS,
        events.map(({ id }) => id),
      ]),
    ).toEqual([
      [15, ["border", "same-time"]],
      [8, ["inside"]],
    ]);
  });

  it("keeps the relevant upcoming day and categorizes tentative releases", () => {
    const upcoming = upcomingNewsToday(
      [
        release("past", -1),
        release("today", 60),
        release("tomorrow", 24 * 60),
        release("tentative", -20, { currency: "GBP", timeKnown: false }),
        release("all-day", -120, { currency: "CAD", allDayOn: today }),
        release("lower-impact", 60, { impact: MARKET_IMPACT.MEDIUM }),
      ],
      now,
      today,
    );
    expect(
      [...upcoming].map(([currency, events]) => [
        currency,
        events.map(({ id }) => id),
      ]),
    ).toEqual([
      ["USD", ["today"]],
      ["GBP", ["tentative"]],
      ["CAD", ["all-day"]],
    ]);
  });

  it("matches both forex currencies, offshore yuan, metals and supported index aliases", () => {
    expect(instrumentNewsCurrencies("eur/usd.raw")).toEqual(["EUR", "USD"]);
    expect(instrumentNewsCurrencies("EURGBP")).toEqual(["EUR", "GBP"]);
    expect(instrumentNewsCurrencies("USDCNH")).toEqual(["USD", "CNY"]);
    expect(instrumentNewsCurrencies("CNY")).toEqual(["CNY"]);
    expect(instrumentNewsCurrencies("XAUUSD")).toEqual(["USD"]);
    expect(instrumentNewsCurrencies("NAS100.cash")).toEqual(["USD"]);
    expect(instrumentNewsCurrencies("GER40")).toEqual(["EUR"]);
    expect(instrumentNewsCurrencies("ABCUSD")).toEqual([]);
  });
});
