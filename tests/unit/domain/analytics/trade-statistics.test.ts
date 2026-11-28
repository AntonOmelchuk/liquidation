import {
  filterStatisticTrades,
  tradeBreakdown,
  tradeFactorKeys,
} from "@liquidation/domain/analytics/trade-factors";
import { tradeStatistics } from "@liquidation/domain/analytics/trade-statistics";
import type { Trade } from "@liquidation/domain/trades/types";
import { expect, test } from "vitest";

const opening = "2026-11-20T08:00:00Z";
const record: Trade = {
  id: "1a047d28-0555-4dfb-b1fb-acfea3c1e577",
  symbol: "EURUSD",
  direction: "long",
  timeframe: "M15",
  openedAt: opening,
  closedAt: "2026-11-20T10:00:00Z",
  profit: 110,
  commission: -10,
  swap: 0,
  risk: 50,
  notes: "",
};

test("shares cost-adjusted results between summary and groups", () => {
  const losing = {
    ...record,
    id: "2a047d28-0555-4dfb-b1fb-acfea3c1e577",
    closedAt: "2026-11-20T16:00:00Z",
    profit: -28,
    commission: -2,
    risk: null,
  };
  const flat = {
    ...record,
    id: "3a047d28-0555-4dfb-b1fb-acfea3c1e577",
    closedAt: "2026-11-21T08:00:00Z",
    profit: 2,
    commission: -2,
  };
  const results = tradeStatistics([flat, record, losing]);
  expect(results).toMatchObject({
    count: 3,
    net: 70,
    wins: 1,
    losses: 1,
    winningPnl: 100,
    losingPnl: 30,
    flat: 1,
    winRate: 1 / 3,
    profitFactor: 100 / 30,
    payoff: 100 / 30,
    expectancy: 70 / 3,
    expectancyR: 1,
    countWithRisk: 2,
    maxDrawdown: 30,
    longestWin: 1,
    longestLoss: 1,
    duration: { median: 8 },
    winningDuration: { mean: 2 },
    losingDuration: { median: 8 },
  });
  expect(tradeFactorKeys(flat, "duration")).toEqual(["4"]);
  expect(tradeFactorKeys(record, "timeframe")).toEqual(["M15"]);
  expect(tradeFactorKeys(record, "model")).toEqual([""]);
});

test("groups simultaneous closes when measuring realized drawdown", () => {
  expect(
    tradeStatistics([
      {
        ...record,
        id: "0a047d28-0555-4dfb-b1fb-acfea3c1e577",
        profit: -50,
        commission: 0,
      },
      { ...record, profit: 70, commission: 0 },
    ]),
  ).toMatchObject({ net: 20, maxDrawdown: 0 });
  expect(tradeStatistics([])).toMatchObject({
    net: 0,
    wins: 0,
    losses: 0,
    winningPnl: 0,
    losingPnl: 0,
    duration: { median: null },
    profitFactor: null,
    winRate: null,
  });
});

test("combines exact filters and keeps unclassified trades available", () => {
  const book = "f1f2691b-ee31-427d-8ea8-d0075a7dad5e";
  const setupId = "bfb04f03-c5e2-4076-b3ff-0aa1e155f5dd";
  const tagged = {
    ...record,
    account: "Evaluation",
    direction: "short",
    session: "NYKZ",
    entryType: "limit",
    limitEntryTest: true,
    playbook: { id: book, version: 2, setupId },
    mistakes: ["Early entry", "Loose stop"],
  } satisfies Trade;
  const olderVersion = {
    ...tagged,
    id: "4a047d28-0555-4dfb-b1fb-acfea3c1e577",
    playbook: { id: book, version: 1, setupId },
    limitEntryTest: false,
  };
  const newerClose = {
    ...tagged,
    id: "5a047d28-0555-4dfb-b1fb-acfea3c1e577",
    closedAt: "2026-11-21T00:00:00Z",
  };
  const trades = [record, olderVersion, tagged, newerClose];
  const window = {
    start: Date.parse(record.closedAt),
    end: Date.parse(newerClose.closedAt),
  };
  expect(
    filterStatisticTrades(trades, window, {
      account: "evaluation",
      session: "NYKZ",
      direction: "short",
      limitEntryTest: "retested",
      mistake: "early entry",
    }),
  ).toEqual([tagged]);
  expect(filterStatisticTrades(trades, window, { account: "" })).toEqual([
    record,
  ]);
  expect(tradeFactorKeys(tagged, "setup")).toEqual([book + ":" + setupId]);
  expect(
    filterStatisticTrades(trades, window, {
      setup: book + ":" + setupId,
    }),
  ).toEqual([olderVersion, tagged]);
  expect(
    filterStatisticTrades(trades, window, { limitEntryTest: "market-only" }),
  ).toEqual([olderVersion]);
  expect(filterStatisticTrades(trades, window, { limitEntryTest: "" })).toEqual(
    [record],
  );
  expect(tradeFactorKeys(tagged, "hour")).toEqual([
    String(new Date(tagged.openedAt).getHours()).padStart(2, "0"),
  ]);
});

test("groups each mistake once per trade and classifies outcomes using net P&L", () => {
  const netLoss = {
    ...record,
    id: "6a047d28-0555-4dfb-b1fb-acfea3c1e577",
    mistakes: ["Early entry", "early entry", "Loose stop"],
    profit: 4,
    commission: -5,
    timeframe: "m15",
  };
  const zero = {
    ...record,
    id: "7a047d28-0555-4dfb-b1fb-acfea3c1e577",
    mistakes: ["Early entry"],
    profit: 5,
    commission: -5,
  };
  const trades = [netLoss, zero, record];
  const rows = new Map(
    tradeBreakdown(trades, "mistake").map((row) => [row.key, row]),
  );

  expect(rows.get("early entry")?.metrics).toMatchObject({ count: 2, net: -1 });
  expect(rows.get("loose stop")?.records).toEqual([netLoss]);
  expect(rows.get("")?.records).toEqual([record]);
  expect(tradeStatistics(trades)).toMatchObject({ count: 3, net: 99 });
  expect(tradeBreakdown(trades, "timeframe")).toMatchObject([
    { key: "M15", metrics: { count: 3 } },
  ]);
  expect(filterStatisticTrades(trades, {}, { outcome: "loss" })).toEqual([
    netLoss,
  ]);
  expect(filterStatisticTrades(trades, {}, { outcome: "flat" })).toEqual([
    zero,
  ]);
});

test("includes configured empty groups without inventing trades or metrics", () => {
  const rows = tradeBreakdown([record], "direction", ["long", "short", "long"]);
  expect(rows).toMatchObject([
    {
      key: "long",
      records: [record],
      metrics: { count: 1, net: 100, winRate: 1 },
    },
    {
      key: "short",
      records: [],
      metrics: {
        count: 0,
        net: 0,
        winRate: null,
        payoff: null,
        profitFactor: null,
        totalR: null,
      },
    },
  ]);
  expect(
    tradeBreakdown([record], "direction", ["short"]).map(({ key }) => key),
  ).toEqual(["short", "long"]);
  expect(tradeBreakdown([], "direction", ["short"])[0].metrics.count).toBe(0);
});
