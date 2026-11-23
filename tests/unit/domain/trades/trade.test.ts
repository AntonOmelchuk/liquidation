import {
  netCents,
  summarize,
  tradeInput,
} from "@liquidation/domain/trades/trade";
import { expect, test } from "vitest";

const trade = {
  id: "1ba272c0-07eb-4686-a9a4-44acf2f6eded",
  symbol: "EURUSD",
  direction: "long" as const,
  openedAt: "2026-11-22T07:00:00Z",
  closedAt: "2026-11-22T08:00:00Z",
  profit: 0.3,
  commission: -0.1,
  swap: -0.2,
  risk: 100,
  notes: "",
};

test("rounds cash to cents before computing net P&L and counting winners", () => {
  expect(netCents(trade)).toBe(0);
  expect(summarize([trade, { ...trade, profit: 100.3 }])).toEqual({
    count: 2,
    net: 100,
    winRate: 0.5,
  });
});

test("rejects a closing time before the entry and sub-cent amounts", () => {
  expect(
    tradeInput.safeParse({ ...trade, closedAt: "2026-11-22T06:00:00Z" })
      .success,
  ).toBe(false);
  expect(tradeInput.safeParse({ ...trade, commission: -0.003 }).success).toBe(
    false,
  );
});
