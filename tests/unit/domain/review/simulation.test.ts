import { expect, test } from "vitest";
import {
  ENTRY_HOUR_SIDE,
  REVIEW_RULE,
} from "@liquidation/domain/review/constants";
import { buildReview } from "@liquidation/domain/review/report";
import { simulateReview } from "@liquidation/domain/review/simulation";
import type { Trade } from "@liquidation/domain/trades/types";

function record(
  id: string,
  opened: string,
  closed: string,
  profit: number,
  account = "A",
): Trade {
  return {
    id,
    symbol: "EURUSD",
    direction: "long",
    account,
    openedAt: `2026-11-${opened}:00Z`,
    closedAt: `2026-11-${closed}:00Z`,
    profit,
    commission: 0,
    swap: 0,
    risk: 10,
    notes: "",
  };
}

const dates = { from: "2026-11-20", through: "2026-11-22", timeZone: "UTC" };

test("daily loss uses only earlier closes from retained trades in the same account and day", () => {
  const first = record("a", "20T09:00", "20T11:00", -10);
  const overlapping = record("b", "20T10:30", "20T12:00", 9);
  const simultaneous = record("c", "20T11:00", "20T12:00", 5);
  const excluded = record("d", "20T11:01", "21T10:00", -7);
  const otherAccount = record("e", "20T11:15", "20T12:00", 5, "B");
  const nextDay = record("f", "21T12:00", "21T13:00", 3);
  const report = buildReview(
    {
      trades: [
        nextDay,
        excluded,
        otherAccount,
        simultaneous,
        first,
        overlapping,
      ],
      positions: [],
    },
    dates,
  );
  const result = simulateReview(report, { kind: REVIEW_RULE.DAILY_LOSS });

  expect(result.excluded).toEqual([excluded]);
  expect(result.before).toMatchObject({ count: 6, net: 5 });
  expect(result.after).toMatchObject({ count: 5, net: 12, winRate: 4 / 5 });
  expect(result.after.totalR).toBeCloseTo(1.2);
});

test("losing streaks are based on earlier closed outcomes per account and reset at a flat trade", () => {
  const first = record("a", "20T09:00", "20T09:15", -10);
  const second = record("b", "20T09:20", "20T09:30", -10);
  const unrelated = record("c", "20T09:45", "20T10:15", -10, "B");
  const after = record("d", "20T10:00", "20T10:45", 0);
  const reset = record("e", "20T11:00", "20T11:15", 18);
  const report = buildReview(
    { trades: [first, second, unrelated, after, reset], positions: [] },
    dates,
  );
  const result = simulateReview(report, { kind: REVIEW_RULE.LOSING_STREAK });

  expect(result.excluded).toEqual([first, second, unrelated, reset]);
  expect(result.after).toMatchObject({ count: 1, net: 0, winRate: 0 });
});

test("hour selection includes the chosen hour on the late side and keeps the same baseline", () => {
  const early = record("early", "20T15:59", "20T16:45", 10);
  const late = record("late", "20T16:00", "20T20:00", -10);
  const report = buildReview({ trades: [early, late], positions: [] }, dates);
  expect(
    simulateReview(report, {
      kind: REVIEW_RULE.ENTRY_HOUR,
      side: ENTRY_HOUR_SIDE.AFTER,
      hour: 16,
    }).excluded,
  ).toEqual([early]);
  const result = simulateReview(report, {
    kind: REVIEW_RULE.MINIMUM_HOLD,
    hours: 4,
  });
  expect(result.excluded).toEqual([early]);
  expect(result.before.count).toBe(2);
  expect(result.after.net).toBe(-10);
});
