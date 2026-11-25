import {
  cardIndex,
  quarterWeeks,
  reportCoverage,
  reportIndex,
} from "@liquidation/domain/workspace/report-index";
import { PERIOD } from "@liquidation/domain/workspace/constants";
import type { Trade } from "@liquidation/domain/trades/types";
import { expect, test } from "vitest";

test("quarter week rows are unique across quarter boundaries", () => {
  const first = quarterWeeks("2026-01-01");
  const second = quarterWeeks("2026-04-01");
  expect(first[0].start).toBe("2025-12-29");
  expect(second[0].start).toBe("2026-03-30");
  expect(new Set([...first, ...second].map(({ start }) => start)).size).toBe(
    first.length + second.length,
  );
  expect(first.every((week) => week.days.length === 7)).toBe(true);
});

test("cards count daily closes and weekly entries; report coverage uses entry days", () => {
  const trade: Trade = {
    id: crypto.randomUUID(),
    symbol: "EURUSD",
    direction: "long",
    openedAt: "2026-11-20T12:00:00Z",
    closedAt: "2026-11-23T12:00:00Z",
    profit: 100,
    commission: -5,
    swap: 0,
    risk: 50,
    notes: "",
  };
  const source = { trades: [trade], positions: [], reports: [] };
  const utc = (iso: string) => iso.slice(0, 10);
  const weeks = cardIndex(source, "2026-11-24", utc);
  expect(
    weeks.find(({ start }) => start === "2026-11-16")?.weekly,
  ).toMatchObject({ net: 95, closed: 1 });
  const current = weeks.find(({ start }) => start === "2026-11-23")!;
  expect(current.weekly.closed).toBe(0);
  expect(current.days[0]).toMatchObject({
    day: "2026-11-23",
    net: 95,
    closed: 1,
    entered: 0,
  });
  expect(reportCoverage(source, PERIOD.MONTH, "2026-11-24", utc)).toEqual({
    tradingDays: 1,
    reviewedDays: 0,
    missingDays: ["2026-11-20"],
  });
  expect(reportIndex(source, "2026-11-24", utc)[0].months[0].metrics.net).toBe(
    95,
  );
});
