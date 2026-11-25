import {
  priceMetrics,
  riskDistribution,
  riskDrawdown,
  stopOverruns,
  summarizePrices,
  tradeCurves,
} from "@liquidation/domain/analytics/trade-risk";
import type { Trade } from "@liquidation/domain/trades/types";
import { tradeInput } from "@liquidation/domain/trades/trade";
import { expect, test } from "vitest";

function trade(
  net: number,
  closedAt: string,
  risk: number | null = 100,
): Trade {
  return {
    id: crypto.randomUUID(),
    symbol: "EURUSD",
    direction: "long",
    openedAt: "2026-11-01T10:00:00Z",
    closedAt,
    profit: net,
    commission: 0,
    swap: 0,
    risk,
    notes: "",
  };
}

test("risk curves group simultaneous closes, drawdown tracks recovery and distributions exclude unknown risk", () => {
  const first = trade(200, "2026-11-02T12:00:00Z");
  const low = trade(-300, "2026-11-03T12:00:00Z");
  const recovery = trade(400, "2026-11-04T12:00:00Z");
  const flat = trade(0, "2026-11-03T12:00:00Z");
  const unmeasured = trade(100, "2026-11-05T12:00:00Z", null);
  const records = [first, low, recovery, flat, unmeasured];
  const curves = tradeCurves(records);
  expect(curves.cash.map(({ value }) => value)).toEqual([200, -100, 300, 400]);
  expect(curves.multiples.map(({ value }) => value)).toEqual([2, -1, 3]);
  expect(riskDrawdown(curves.multiples)).toEqual({
    amount: 3,
    peakValue: 2,
    peakAt: Date.parse(first.closedAt),
    troughAt: Date.parse(low.closedAt),
    recoveredAt: Date.parse(recovery.closedAt),
  });
  expect(
    riskDistribution(records).reduce((sum, bucket) => sum + bucket.count, 0),
  ).toBe(4);
  expect(stopOverruns(records)).toEqual([{ trade: low, r: -3, excessR: 2 }]);
});

test("price R, planned RR and excursions are direction-aware and remain separate from net R", () => {
  const long = {
    ...trade(200, "2026-11-02T12:00:00Z"),
    prices: {
      entry: 100,
      stop: 98,
      target: 106,
      exit: 104,
      favorable: 105,
      adverse: 99,
    },
  };
  const short = {
    ...long,
    direction: "short" as const,
    prices: {
      entry: 100,
      stop: 102,
      target: 94,
      exit: 96,
      favorable: 95,
      adverse: 101,
    },
  };
  expect(priceMetrics(long)).toEqual({
    plannedRR: 3,
    grossR: 2,
    mfe: 2.5,
    mae: 0.5,
    givebackR: 0.5,
  });
  expect(priceMetrics(short)).toEqual(priceMetrics(long));
  expect(
    summarizePrices([long, short, trade(0, "2026-11-02T12:00:00Z")]).mfe,
  ).toEqual({ count: 2, average: 2.5 });
  expect(
    tradeInput.safeParse({ ...long, prices: { ...long.prices, stop: 102 } })
      .success,
  ).toBe(false);
  expect(tradeInput.safeParse(short).success).toBe(true);
});
