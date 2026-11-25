import type { Position, Trade } from "@liquidation/domain/trades/types";
import {
  assessmentCandidates,
  calendarMonth,
  recentTradeReview,
  reviewTrades,
} from "@liquidation/domain/workspace/analytics";
import { PERIOD } from "@liquidation/domain/workspace/constants";
import {
  periodBounds,
  previousPeriod,
} from "@liquidation/domain/workspace/period";
import { describe, expect, it } from "vitest";

function trade(
  openedAt: string,
  closedAt: string,
  profit: number,
  commission = 0,
): Trade {
  return {
    id: crypto.randomUUID(),
    symbol: "EURUSD",
    direction: "long",
    openedAt,
    closedAt,
    profit,
    commission,
    swap: 0,
    risk: 10,
    notes: "",
  };
}
const utcDay = (iso: string) => iso.slice(0, 10);

describe("workspace calendar", () => {
  it("uses the selected time zone's dates, sums fees in cents and excludes dates outside the month", () => {
    const at = (iso: string) =>
      new Date(Date.parse(iso) + 2 * 3600000).toISOString().slice(0, 10);
    const first = trade(
      "2026-10-31T19:00:00Z",
      "2026-10-31T22:00:00Z",
      30.18,
      -0.08,
    );
    const loss = trade("2026-11-02T10:00:00Z", "2026-11-02T20:00:00Z", -5.01);
    const flat = trade("2026-11-03T10:00:00Z", "2026-11-03T17:00:00Z", 3, -3);
    const outside = trade("2026-11-30T19:00:00Z", "2026-11-30T22:00:00Z", 200);
    const calendar = calendarMonth([first, loss, flat, outside], "2026-11", at);
    expect(calendar.days.get("2026-11-01")).toEqual({
      net: 3010,
      trades: [first],
      wins: 1,
    });
    expect(calendar.days.get("2026-11-03")).toEqual({
      net: 0,
      trades: [flat],
      wins: 0,
    });
    expect(calendar.days.has("2026-12-01")).toBe(false);
    expect(calendar.weeks[0]).toMatchObject({ active: 1, net: 3010 });
    expect(calendar.weeks[1]).toMatchObject({ active: 2, net: -501 });
    expect(calendar).toMatchObject({ net: 2509, active: 3 });
  });

  it("handles Monday weeks, leap months and quarters over year boundaries", () => {
    expect(periodBounds(PERIOD.WEEK, "2026-01-01")).toEqual({
      start: "2025-12-29",
      through: "2026-01-04",
    });
    expect(periodBounds(PERIOD.MONTH, "2028-02-29")).toEqual({
      start: "2028-02-01",
      through: "2028-02-29",
    });
    expect(previousPeriod(PERIOD.QUARTER, "2026-01-01")).toEqual({
      start: "2025-10-01",
      through: "2025-12-31",
    });
  });
});

describe("review cohorts", () => {
  it("counts WRC entries, DRC closes and carried trades separately", () => {
    const carried = trade("2026-11-20T13:00:00Z", "2026-11-23T15:00:00Z", -40);
    const laterClose = trade(
      "2026-11-27T12:00:00Z",
      "2026-12-01T12:00:00Z",
      30,
    );
    const open: Position = {
      id: crypto.randomUUID(),
      symbol: "GBPUSD",
      direction: "short",
      openedAt: "2026-11-23T11:00:00Z",
      risk: null,
      notes: "",
      revision: 1,
    };
    const trades = [carried, laterClose];
    expect(reviewTrades(trades, PERIOD.DAY, "2026-11-23", utcDay)).toEqual([
      carried,
    ]);
    expect(reviewTrades(trades, PERIOD.WEEK, "2026-11-23", utcDay)).toEqual([
      laterClose,
    ]);
    expect(reviewTrades(trades, PERIOD.MONTH, "2026-11-23", utcDay)).toEqual([
      carried,
    ]);
    expect(
      assessmentCandidates(trades, [open], PERIOD.DAY, "2026-11-23", utcDay),
    ).toEqual([carried, open]);
    expect(
      assessmentCandidates(trades, [open], PERIOD.WEEK, "2026-11-23", utcDay),
    ).toEqual([carried, laterClose, open]);
  });

  it("selects two disjoint cohorts of 20 by close time", () => {
    const ordered = Array.from({ length: 42 }, (_, hour) =>
      trade(
        "2026-11-20T00:00:00Z",
        new Date(Date.UTC(2026, 10, 21, hour)).toISOString(),
        hour,
      ),
    );
    const result = recentTradeReview([
      ...ordered.slice(9),
      ...ordered.slice(0, 9),
    ]);
    expect(result.current).toEqual(ordered.slice(22).reverse());
    expect(result.previous).toEqual(ordered.slice(2, 22).reverse());
    expect(recentTradeReview(ordered.slice(0, 25)).previous).toHaveLength(5);
  });
});
