import { comparePlanPerformance } from "@liquidation/domain/analytics/plan-performance";
import {
  planReviewSchema,
  planSetupSchema,
} from "@liquidation/domain/plans/plan";
import type { Plan } from "@liquidation/domain/plans/types";
import type { Trade } from "@liquidation/domain/trades/types";
import { expect, test } from "vitest";

const setup = {
  title: "London reversal",
  symbol: "EURUSD",
  direction: "long" as const,
  entryCondition: "Entry after a sweep and a reclaim.",
  entry: 1.09,
  stop: 1.088,
  target: 1.094,
};

test("validates setup prices and requires a reason for failed plans", () => {
  expect(planSetupSchema.safeParse(setup).success).toBe(true);
  expect(
    planSetupSchema.safeParse({ ...setup, direction: "short" }).success,
  ).toBe(false);
  expect(
    planReviewSchema.safeParse({ status: "failed", reason: "  " }).success,
  ).toBe(false);
  expect(
    planReviewSchema.parse({
      status: "failed",
      reason: " Invalidation before entry ",
    }),
  ).toEqual({
    status: "failed",
    reason: "Invalidation before entry",
  });
  expect(
    planReviewSchema.safeParse({ status: "missed", outcome: null }).success,
  ).toBe(true);
  expect(
    planReviewSchema.safeParse({ status: "missed", outcome: { netR: 2 } })
      .success,
  ).toBe(false);
});

const openedAt = "2026-11-19T12:00:00Z";
const closedAt = "2026-11-20T12:00:00Z";
const later = "2026-11-22T08:00:00Z";
function plan(number: number, review: Plan["review"]): Plan {
  return {
    id: `0a047d28-0555-4dfb-b1fb-${String(number).padStart(12, "0")}`,
    revision: 1,
    createdAt: openedAt,
    updatedAt: closedAt,
    setup,
    review,
  };
}
function missed(number: number, netR: number, at = closedAt) {
  return plan(number, { status: "missed", outcome: { netR, closedAt: at } });
}
const trade: Trade = {
  id: "2a047d28-0555-4dfb-b1fb-acfea3c1e577",
  symbol: "EURUSD",
  direction: "long",
  openedAt,
  closedAt,
  profit: 55,
  commission: -5,
  swap: 0,
  risk: 25,
  notes: "",
};

test("compares real and missed results chronologically and avoids double-counting links", () => {
  const linkedClosed = missed(5, 20);
  const linkedOpen = missed(6, -20);
  const data = comparePlanPerformance({
    plans: [
      plan(1, { status: "worked" }),
      plan(2, { status: "failed", reason: "Stopped out" }),
      missed(3, -1, later),
      missed(4, 3),
      linkedClosed,
      linkedOpen,
      plan(7, { status: "missed", outcome: null }),
      plan(8, { status: "waiting" }),
    ],
    positions: [
      {
        id: "1a047d28-0555-4dfb-b1fb-acfea3c1e577",
        revision: 1,
        symbol: trade.symbol,
        direction: trade.direction,
        openedAt,
        risk: null,
        notes: "",
        planId: linkedOpen.id,
      },
    ],
    trades: [
      { ...trade, planId: linkedClosed.id },
      { ...trade, risk: null },
    ],
  });

  expect(data).toMatchObject({
    planWinRate: 0.5,
    missedWinRate: 0.5,
    decided: 2,
    tradesWithoutRisk: 1,
    linkedMisses: 2,
    assessedMisses: 2,
    realized: 2,
    missed: 2,
    scenario: 4,
    points: [
      { timestamp: Date.parse(closedAt), realized: 2, scenario: 5 },
      { timestamp: Date.parse(later), realized: 2, scenario: 4 },
    ],
  });
});

test("leaves win rates undefined until there are outcomes", () => {
  expect(
    comparePlanPerformance({
      plans: [plan(1, { status: "in-progress" })],
      positions: [],
      trades: [],
    }),
  ).toMatchObject({ planWinRate: null, missedWinRate: null, points: [] });
});

test("values missed trades in the same currency while excluding links outside the selected period", () => {
  const withRisk = plan(10, {
    status: "missed",
    outcome: { closedAt, netR: -1.5, risk: 20 },
  });
  const linked = plan(11, {
    status: "missed",
    outcome: { closedAt, netR: 3, risk: 40 },
  });
  const withoutRisk = missed(12, 2);
  const data = comparePlanPerformance(
    {
      plans: [withRisk, linked, withoutRisk],
      trades: [
        { ...trade, risk: null, profit: 25 },
        { ...trade, closedAt: later, planId: linked.id },
      ],
      positions: [],
    },
    { start: Date.parse(closedAt), end: Date.parse(later) },
  );
  expect(data).toMatchObject({
    linkedMisses: 1,
    tradesWithoutRisk: 1,
    missesWithoutRisk: 1,
    assessedMisses: 2,
    realized: 0,
    scenario: 0.5,
    cash: {
      realized: 20,
      missed: -30,
      scenario: -10,
      points: [
        { timestamp: Date.parse(closedAt), realized: 20, scenario: -10 },
      ],
    },
  });
});

test("reports confirmed correct plans over all saved plans separately from reviewed accuracy", () => {
  const plans = [
    ...Array.from({ length: 12 }, (_, index) =>
      plan(index + 1, { status: "worked" }),
    ),
    ...Array.from({ length: 3 }, (_, index) =>
      plan(index + 13, { status: "failed", reason: "Invalidation" }),
    ),
    ...Array.from({ length: 5 }, (_, index) =>
      plan(index + 16, { status: "waiting" }),
    ),
  ];
  expect(
    comparePlanPerformance({ plans, trades: [], positions: [] }),
  ).toMatchObject({
    statuses: { worked: 12, failed: 3, waiting: 5 },
    decided: 15,
    allPlanWinRate: 0.6,
    planWinRate: 0.8,
  });
});
