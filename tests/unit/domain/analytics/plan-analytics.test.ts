import { summarizePlanGroups } from "@liquidation/domain/analytics/plan-analytics";
import type { Plan } from "@liquidation/domain/plans/types";
import type { Position, Trade } from "@liquidation/domain/trades/types";
import { expect, test } from "vitest";

const openedAt = "2026-11-20T10:00:00Z";
const closedAt = "2026-11-23T10:00:00Z";
const playbook = { id: "0a047d28-0555-4dfb-b1fb-acfea3c1e577", version: 1 };

function plan(
  id: string,
  review: Plan["review"],
  setup: Partial<Plan["setup"]> = {},
): Plan {
  return {
    id,
    revision: 1,
    createdAt: openedAt,
    updatedAt: closedAt,
    setup: {
      title: "New York reversal",
      symbol: "EURUSD",
      direction: "long",
      entryCondition: "Reclaim",
      playbook,
      ...setup,
    },
    review,
  };
}

const trade: Trade = {
  id: "trade-1",
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

test("counts decided plans, measures linked realized R and excludes misses with actual execution", () => {
  const plans = [
    plan("worked", { status: "worked" }),
    plan("failed", { status: "failed", reason: "No confirmation" }),
    plan("pending", { status: "in-progress" }),
    plan("miss", { status: "missed", outcome: { closedAt, netR: 1.5 } }),
    plan("unassessed", { status: "missed", outcome: null }),
    plan("linked-open", { status: "missed", outcome: { closedAt, netR: 10 } }),
    plan("linked-closed", {
      status: "missed",
      outcome: { closedAt, netR: 20 },
    }),
  ];
  const position: Position = {
    id: "open-position",
    revision: 1,
    symbol: "EURUSD",
    direction: "long",
    openedAt,
    risk: 25,
    notes: "",
    planId: "linked-open",
  };
  const groups = summarizePlanGroups(
    {
      plans,
      trades: [
        { ...trade, planId: "worked" },
        { ...trade, id: "trade-2", risk: null, planId: "linked-closed" },
        { ...trade, id: "trade-3", profit: 120, planId: "different-plan" },
        { ...trade, id: "trade-4", profit: 120 },
      ],
      positions: [position],
    },
    "instrumentAndPlaybook",
  );

  expect(groups).toHaveLength(1);
  expect(groups[0]).toMatchObject({
    instrument: "EURUSD",
    playbook,
    plans,
    worked: 1,
    reviewed: 2,
    winRate: 0.5,
    closed: 2,
    measured: 1,
    realizedR: 2,
    missed: 4,
    assessedMisses: 1,
    missedR: 1.5,
  });
});

test("groups instruments and exact playbook versions, retaining plans without a playbook", () => {
  const plans = [
    plan("eur-v1", { status: "worked" }),
    plan(
      "eur-v2",
      { status: "worked" },
      { playbook: { ...playbook, version: 2 } },
    ),
    plan("gbp-v1", { status: "worked" }, { symbol: "GBPUSD" }),
    plan("no-playbook", { status: "waiting" }, { playbook: undefined }),
  ];
  const records = { plans, trades: [], positions: [] };
  const combined = summarizePlanGroups(records, "instrumentAndPlaybook");

  expect(combined).toHaveLength(4);
  expect(new Set(combined.map(({ key }) => key)).size).toBe(4);
  const byInstrument = summarizePlanGroups(records, "instrument");
  expect(byInstrument[0]).toMatchObject({
    instrument: "EURUSD",
    plans: [plans[0], plans[1], plans[3]],
    winRate: 1,
  });

  const byPlaybook = summarizePlanGroups(records, "playbook");
  expect(byPlaybook).toHaveLength(3);
  expect(byPlaybook[0]).toMatchObject({
    playbook,
    plans: [plans[0], plans[2]],
  });
  expect(byPlaybook.find((group) => !group.playbook)).toMatchObject({
    plans: [plans[3]],
    winRate: null,
    realizedR: null,
    missedR: null,
  });
});

test("reports measured break-even separately from an unavailable result", () => {
  const [group] = summarizePlanGroups(
    {
      plans: [
        plan("breakeven", { status: "failed", reason: "No follow-through" }),
        plan("miss", { status: "missed", outcome: { closedAt, netR: 0 } }),
      ],
      trades: [{ ...trade, profit: 5, planId: "breakeven" }],
      positions: [],
    },
    "instrument",
  );

  expect(group).toMatchObject({
    winRate: 0,
    realizedR: 0,
    missedR: 0,
    measured: 1,
    assessedMisses: 1,
  });
});
