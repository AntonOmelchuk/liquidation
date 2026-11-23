import type { Plan } from "@liquidation/domain/plans/types";
import { expect, test } from "vitest";

import {
  filterPlanAnalytics,
  planPlaybookKey,
} from "../../../../apps/web/src/features/plans/analytics/filters.ts";
import {
  filterPlans,
  filterPlansByStartDate,
} from "../../../../apps/web/src/features/plans/list/filters.ts";

const plans: Plan[] = [
  {
    id: "0a047d28-0555-4dfb-b1fb-acfea3c1e577",
    revision: 1,
    createdAt: "2026-11-20T10:00:00Z",
    updatedAt: "2026-11-20T10:00:00Z",
    setup: {
      title: "London reversal",
      symbol: "EURUSD",
      direction: "long",
      entryCondition: "Reclaim",
    },
    review: { status: "worked" },
  },
  {
    id: "0a047d28-0555-4dfb-b1fb-acfea3c1e578",
    revision: 1,
    createdAt: "2026-11-22T10:00:00Z",
    updatedAt: "2026-11-22T10:00:00Z",
    setup: {
      title: "London continuation",
      symbol: "GBPUSD",
      direction: "short",
      entryCondition: "Breakout",
    },
    review: { status: "failed", reason: "No entry trigger" },
  },
];

test("combines text and status filters and sorts without changing the stored order", () => {
  expect(
    filterPlans(plans, { query: " london ", status: "failed", sort: "latest" }),
  ).toEqual([plans[1]]);
  expect(
    filterPlans(plans, { query: "gbpusd", status: "worked", sort: "latest" }),
  ).toEqual([]);
  expect(
    filterPlans(plans, { query: "", status: "all", sort: "latest" }),
  ).toEqual([plans[1], plans[0]]);
  expect(
    filterPlans(plans, { query: "", status: "all", sort: "earliest" }),
  ).toEqual([plans[0], plans[1]]);
  expect(plans[0].setup.symbol).toBe("EURUSD");
});

test("uses the inclusive plan start date or the local creation date", () => {
  const scheduled: Plan = {
    ...plans[0],
    createdAt: new Date(2026, 10, 21, 12).toISOString(),
    setup: { ...plans[0].setup, startsOn: "2026-11-23", endsOn: "2026-11-24" },
  };
  const unscheduled: Plan = {
    ...plans[1],
    createdAt: new Date(2026, 10, 23, 12).toISOString(),
  };
  const records = [scheduled, unscheduled];

  expect(
    filterPlansByStartDate(records, {
      from: "2026-11-23",
      through: "2026-11-23",
    }),
  ).toEqual(records);
  expect(
    filterPlansByStartDate(records, { from: "", through: "2026-11-22" }),
  ).toEqual([]);
  expect(
    filterPlansByStartDate(records, { from: "2026-11-24", through: "" }),
  ).toEqual([]);
  expect(filterPlansByStartDate(records, { from: "", through: "" })).toEqual(
    records,
  );
});

test("combines plan start date, instrument, status, side and exact playbook version", () => {
  const book = "ed8baeb1-1681-4cbf-9c5e-84a0648cc107";
  const dated = {
    ...plans[0],
    setup: { ...plans[0].setup, startsOn: "2026-11-23" },
  };
  const v1 = {
    ...dated,
    setup: { ...dated.setup, playbook: { id: book, version: 1 } },
  };
  const v2 = {
    ...dated,
    setup: { ...dated.setup, playbook: { id: book, version: 2 } },
  };
  const all = [dated, v1, v2, plans[1]];
  const filters = {
    dates: { from: "2026-11-23", through: "2026-11-23" },
    instrument: "EURUSD",
    status: "worked",
    side: "long",
  } as const;
  expect(
    filterPlanAnalytics(all, { ...filters, playbook: planPlaybookKey(v2) }),
  ).toEqual([v2]);
  expect(filterPlanAnalytics(all, { ...filters, playbook: "" })).toEqual([
    dated,
  ]);
  expect(filterPlanAnalytics(all, { ...filters, side: "short" })).toEqual([]);
});
