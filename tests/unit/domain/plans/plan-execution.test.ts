import {
  indexPlanExecution,
  planExecution,
} from "@liquidation/domain/plans/plan-execution";
import {
  canLinkPlan,
  getPlanPeriod,
} from "@liquidation/domain/plans/plan-lifecycle";
import type { Plan } from "@liquidation/domain/plans/types";
import type { Trade } from "@liquidation/domain/trades/types";
import { expect, test } from "vitest";

const plan: Plan = {
  id: "65f2d893-f191-4a79-9f46-b5e468015cda",
  createdAt: "2026-11-21T09:00:00Z",
  updatedAt: "2026-11-21T09:00:00Z",
  revision: 1,
  setup: {
    title: "London reversal",
    symbol: "EURUSD",
    direction: "long",
    narrative: "bullish",
    startsOn: "2026-11-23",
    endsOn: "2026-11-27",
    entryCondition: "Enter after a reclaim.",
  },
  review: { status: "in-progress" },
};

const trade: Trade = {
  id: "65f2d893-f191-4a79-9f46-b5e468015cdb",
  planId: plan.id,
  openedAt: "2026-11-23T08:00:00Z",
  closedAt: "2026-11-23T09:00:00Z",
  direction: "long",
  symbol: "EURUSD",
  risk: 10,
  profit: 22,
  commission: -2,
  swap: 0,
  notes: "",
};

test("compares trades with the original narrative and keeps missing risk out of the R totals", () => {
  const position = {
    ...trade,
    direction: "short" as const,
    revision: 1,
  };
  const finished = [
    trade,
    { ...trade, profit: 2, risk: null },
    { ...trade, profit: -8, direction: "short" as const },
    { ...trade, planId: undefined, profit: 500 },
  ];
  const revised: Plan = {
    ...plan,
    setup: { ...plan.setup, narrative: "bearish" },
    originalSetup: plan.setup,
  };
  const execution = indexPlanExecution([revised], finished, [position]).get(
    plan.id,
  );

  expect(execution).toMatchObject({
    narrative: "bullish",
    actual: {
      count: 4,
      closed: 3,
      open: 1,
      wins: 1,
      flat: 1,
      losses: 1,
      net: 10,
      winRate: 1 / 3,
      totalR: 1,
      missingRisk: 1,
    },
    alignment: {
      withNarrative: { count: 2, totalR: 2 },
      againstNarrative: { count: 2, totalR: -1 },
    },
  });
  expect(
    planExecution(
      { ...plan, setup: { ...plan.setup, narrative: "no-trade" } },
      [trade],
      [],
    ).alignment,
  ).toMatchObject({
    withNarrative: { count: 0 },
    againstNarrative: { count: 1 },
  });
  expect(
    planExecution(
      { ...plan, setup: { ...plan.setup, narrative: "neutral" } },
      [trade],
      [],
    ).alignment,
  ).toBeNull();
});

test("uses inclusive plan dates and respects void and restore events", () => {
  expect(canLinkPlan(plan, "2026-11-23")).toBe(true);
  expect(canLinkPlan(plan, "2026-11-27")).toBe(true);
  expect(canLinkPlan(plan, "2026-11-28")).toBe(false);
  expect(getPlanPeriod(plan, "2026-11-22")).toBe("current");
  expect(getPlanPeriod(plan, "2026-11-28")).toBe("past");

  const at = "2026-11-24T15:00:00Z";
  const voided: Plan = {
    ...plan,
    events: [{ id: plan.id, kind: "void", at, reason: "Invalid setup" }],
  };
  expect(canLinkPlan(voided, "2026-11-24")).toBe(false);
  expect(getPlanPeriod(voided, "2026-11-24")).toBe("past");
  const restored: Plan = {
    ...plan,
    events: [...(voided.events ?? []), { id: trade.id, kind: "restore", at }],
  };
  expect(canLinkPlan(restored, "2026-11-24")).toBe(true);
  expect(getPlanPeriod(restored, "2026-11-24")).toBe("current");
});
