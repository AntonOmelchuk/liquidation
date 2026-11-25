import { comparePlanPerformance } from "@liquidation/domain/analytics/plan-performance";
import { summarizeBreakevenReviews } from "@liquidation/domain/analytics/breakeven-review";
import { summarizePlanGroups } from "@liquidation/domain/analytics/plan-analytics";
import { PLAN_GROUPING } from "@liquidation/domain/analytics/constants";
import { PLAYBOOK_TEMPLATE } from "@liquidation/domain/playbooks/constants";
import {
  emptyPlaybookStrategy,
  getPlaybookTemplate,
  strategyScreenshotIds,
} from "@liquidation/domain/playbooks/strategy";
import type { Plan } from "@liquidation/domain/plans/types";
import type { Trade } from "@liquidation/domain/trades/types";
import { PERIOD } from "@liquidation/domain/workspace/constants";
import { periodBounds } from "@liquidation/domain/workspace/period";
import type { MissedTrade } from "@liquidation/domain/workspace/types";
import { workspaceCommand } from "@liquidation/domain/workspace/workspace";
import { expect, test } from "vitest";

const entered = "2026-11-23T15:00:00Z";
const closed = "2026-11-23T16:00:00Z";
const basePlan: Plan = {
  id: crypto.randomUUID(),
  revision: 1,
  createdAt: entered,
  updatedAt: closed,
  setup: {
    title: "Example",
    symbol: "EURUSD",
    direction: "long",
    entryCondition: "Example entry",
  },
  review: {
    status: "missed",
    outcome: { closedAt: closed, netR: 5, risk: 100 },
  },
};
const baseMiss: MissedTrade = {
  id: crypto.randomUUID(),
  revision: 1,
  symbol: "EURUSD",
  direction: "long",
  missedAt: entered,
  reason: "fear",
  notes: "",
  screenshotIds: [],
  outcome: { closedAt: closed, netR: 3, risk: 40 },
};
const trade: Trade = {
  id: crypto.randomUUID(),
  symbol: "EURUSD",
  direction: "long",
  openedAt: entered,
  closedAt: closed,
  profit: 55,
  commission: -5,
  swap: 0,
  risk: 25,
  notes: "",
};

test("combines signed estimates with actual results and counts linked opportunities exactly once", () => {
  const records = {
    plans: [basePlan],
    positions: [],
    trades: [trade],
    missedTrades: [
      { ...baseMiss, planId: basePlan.id },
      {
        ...baseMiss,
        id: crypto.randomUUID(),
        outcome: { closedAt: closed, netR: -1, risk: 40 },
      },
      {
        ...baseMiss,
        id: crypto.randomUUID(),
        outcome: { closedAt: closed, netR: 2 },
      },
      { ...baseMiss, id: crypto.randomUUID(), outcome: null },
    ],
  };
  const result = comparePlanPerformance(records);
  expect(result).toMatchObject({
    assessedMisses: 3,
    replacedPlanMisses: 1,
    recordedMisses: 3,
    missesWithoutRisk: 1,
    realized: 2,
    missed: 4,
    scenario: 6,
    cash: { realized: 50, missed: 80, scenario: 130 },
  });

  const executed = comparePlanPerformance({
    ...records,
    trades: [{ ...trade, planId: basePlan.id }],
  });
  expect(executed).toMatchObject({
    linkedMisses: 1,
    assessedMisses: 2,
    missed: 1,
    cash: { realized: 50, missed: -40, scenario: 10 },
  });
  const pending = comparePlanPerformance({
    ...records,
    missedTrades: [{ ...baseMiss, planId: basePlan.id, outcome: null }],
  });
  expect(pending).toMatchObject({
    missed: 0,
    assessedMisses: 0,
    replacedPlanMisses: 1,
  });
  const range = comparePlanPerformance(records, {
    start: Date.parse(closed) + 1,
  });
  expect(range.cash.points).toEqual([]);
  expect(summarizePlanGroups(records, PLAN_GROUPING.INSTRUMENT)).toMatchObject([
    { missed: 1, assessedMisses: 1, missedR: 3, realizedR: null },
  ]);
});

test("compares missed profit with avoided loss from BE while preserving plan opportunity estimates", () => {
  const records: MissedTrade[] = [
    {
      ...baseMiss,
      planId: basePlan.id,
      reason: "worked-after-be",
      outcome: { closedAt: closed, netR: 2, risk: 40 },
    },
    {
      ...baseMiss,
      id: crypto.randomUUID(),
      reason: "be-saved-stop",
      outcome: { closedAt: closed, netR: -0.75, risk: 40 },
    },
    {
      ...baseMiss,
      id: crypto.randomUUID(),
      reason: "be-saved-stop",
      outcome: { closedAt: closed, netR: -1 },
    },
    {
      ...baseMiss,
      id: crypto.randomUUID(),
      reason: "worked-after-be",
      outcome: null,
    },
  ];
  expect(summarizeBreakevenReviews([...records, baseMiss])).toEqual({
    rows: [
      {
        reason: "worked-after-be",
        count: 2,
        assessed: 1,
        measuredCash: 1,
        effectR: -2,
        effectCents: -8000,
      },
      {
        reason: "be-saved-stop",
        count: 2,
        assessed: 2,
        measuredCash: 1,
        effectR: 1.75,
        effectCents: 3000,
      },
    ],
    total: {
      count: 4,
      assessed: 3,
      measuredCash: 2,
      effectR: -0.25,
      effectCents: -5000,
    },
  });
  const source = {
    plans: [basePlan],
    positions: [],
    trades: [trade],
    missedTrades: records,
  };
  expect(comparePlanPerformance(source)).toMatchObject({
    assessedMisses: 1,
    replacedPlanMisses: 0,
    recordedMisses: 0,
    realized: 2,
    missed: 5,
    cash: { realized: 50, missed: 500 },
  });
  expect(summarizePlanGroups(source, PLAN_GROUPING.INSTRUMENT)).toMatchObject([
    { missed: 1, assessedMisses: 1, missedR: 5 },
  ]);
});

test("validates separate daily, weekly and missed trade records", () => {
  const id = crypto.randomUUID();
  const watch = {
    record: "watchlist",
    start: "2026-11-23",
    input: {
      outlook: "",
      review: "",
      items: [
        {
          symbol: "eurusd",
          narrative: "bullish",
          notes: "",
          planIds: [],
          outcome: "pending",
          review: "",
          screenshotIds: [],
        },
      ],
    },
  };
  const parsed = workspaceCommand.safeParse(watch);
  expect(parsed.success).toBe(true);
  expect(
    workspaceCommand.safeParse({ ...watch, start: "2026-11-24" }).success,
  ).toBe(false);
  expect(
    workspaceCommand.safeParse({
      ...watch,
      input: {
        ...watch.input,
        items: [
          ...watch.input.items,
          { ...watch.input.items[0], symbol: "EURUSD" },
        ],
      },
    }).success,
  ).toBe(false);
  expect(periodBounds(PERIOD.WEEK, "2026-11-29")).toEqual({
    start: "2026-11-23",
    through: "2026-11-29",
  });
  expect(
    workspaceCommand.safeParse({
      record: "thought",
      day: "2026-11-24",
      input: { text: "", screenshotIds: [] },
    }).success,
  ).toBe(false);
  expect(
    workspaceCommand.safeParse({
      record: "missed",
      id,
      input: {
        ...baseMiss,
        outcome: { closedAt: "2026-11-23T14:00:00Z", netR: 1 },
      },
    }).success,
  ).toBe(false);
  expect(
    workspaceCommand.safeParse({
      record: "missed",
      id,
      input: { ...baseMiss, outcome: { closedAt: closed, netR: 0 } },
    }).success,
  ).toBe(true);
});

test("supports a distinct community template and includes illustrated examples in attachment bookkeeping", () => {
  const strategy = emptyPlaybookStrategy(PLAYBOOK_TEMPLATE.COMMUNITY);
  expect(getPlaybookTemplate(strategy)).toBe(PLAYBOOK_TEMPLATE.COMMUNITY);
  expect(getPlaybookTemplate(emptyPlaybookStrategy())).toBe(
    PLAYBOOK_TEMPLATE.STRATEGY,
  );
  expect(getPlaybookTemplate()).toBe(PLAYBOOK_TEMPLATE.STANDARD);
  const screenshot = crypto.randomUUID();
  strategy.community!.chartExamples.push({
    id: crypto.randomUUID(),
    label: "Top-down analysis",
    detail: "",
    screenshotIds: [screenshot],
  });
  expect(strategyScreenshotIds(strategy)).toEqual([screenshot]);
});
