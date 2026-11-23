import type { Position, Trade } from "@liquidation/domain/trades/types";
import { expect, test } from "vitest";

import { playbookFrame } from "@liquidation/domain/playbooks/playbook-frame";

test("measures limits as of entry time and excludes the record being edited", () => {
  const id = "0a047d28-0555-4dfb-b1fb-acfea3c1e577";
  const date = (day: number, hour = 12) =>
    new Date(2026, 10, day, hour).toISOString();
  const source = {
    id: "1a047d28-0555-4dfb-b1fb-acfea3c1e577",
    symbol: "EURUSD",
    direction: "long" as const,
    openedAt: date(16),
    risk: 20,
    notes: "",
    playbook: { id },
  };
  const trade: Trade = {
    ...source,
    closedAt: date(17),
    profit: -20,
    commission: 0,
    swap: 0,
  };
  const later: Trade = {
    ...trade,
    id: "2a047d28-0555-4dfb-b1fb-acfea3c1e577",
    closedAt: date(22),
  };
  const earlier: Trade = {
    ...trade,
    id: "3a047d28-0555-4dfb-b1fb-acfea3c1e577",
    openedAt: date(12),
    closedAt: date(14),
    profit: -40,
  };
  const open: Position = {
    ...source,
    id: "4a047d28-0555-4dfb-b1fb-acfea3c1e577",
    revision: 1,
  };
  expect(
    playbookFrame(
      [trade, later, earlier],
      [open],
      id,
      new Date(date(18)),
      25,
      open.id,
    ),
  ).toMatchObject({
    values: {
      maxInitialRisk: 25,
      maxWeekLossR: 1,
      maxTradesWeek: 3,
      maxTradesMonth: 4,
      maxOpen: 2,
    },
    missingRisk: 0,
  });
});
