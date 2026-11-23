import { performanceByInstrument } from "@liquidation/domain/analytics/instrument-performance";
import { expect, test } from "vitest";

const trade = {
  id: "0a047d28-0555-4dfb-b1fb-acfea3c1e577",
  symbol: "EURUSD",
  direction: "long" as const,
  openedAt: "2026-11-20T10:00:00Z",
  closedAt: "2026-11-20T11:00:00Z",
  profit: 12,
  commission: -2,
  swap: 0,
  risk: null,
  notes: "",
};

test("groups exact tickers and computes net P&L, win rate and profit factor after costs", () => {
  expect(
    performanceByInstrument([
      trade,
      { ...trade, profit: 0, swap: -3 },
      { ...trade, profit: 2 },
      { ...trade, symbol: "EURUSD.A", profit: 20 },
    ]),
  ).toEqual([
    {
      symbol: "EURUSD.A",
      count: 1,
      winRate: 1,
      net: 18,
      profitFactor: Infinity,
    },
    { symbol: "EURUSD", count: 3, winRate: 1 / 3, net: 5, profitFactor: 2 },
  ]);
});

test("distinguishes losing groups, break-even groups and missing trades", () => {
  expect(performanceByInstrument([])).toEqual([]);
  expect(
    performanceByInstrument([
      { ...trade, symbol: "NAS100", profit: 2 },
      { ...trade, symbol: "XAUUSD", profit: 0 },
    ]),
  ).toEqual([
    { symbol: "NAS100", count: 1, winRate: 0, net: 0, profitFactor: null },
    { symbol: "XAUUSD", count: 1, winRate: 0, net: -2, profitFactor: 0 },
  ]);
});
