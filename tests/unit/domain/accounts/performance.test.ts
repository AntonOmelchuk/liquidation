import {
  accountSchema,
  movementSchema,
} from "@liquidation/domain/accounts/account";
import {
  accountPerformance,
  accountRuleProgress,
  firmDay,
} from "@liquidation/domain/accounts/performance";
import { realizedR } from "@liquidation/domain/trades/trade";
import type { Position, Trade } from "@liquidation/domain/trades/types";
import { expect, test } from "vitest";

test("computes account ledger, funded base, firm-day losses and stop risk independently of cash transfers", () => {
  const account = accountSchema.parse({
    id: crypto.randomUUID(),
    revision: 1,
    name: "Evaluation",
    kind: "prop",
    firm: "Example firm",
    currency: "USD",
    startingBalance: 10000,
    archived: false,
    notes: "",
    rules: {
      dailyLimit: { unit: "percent", value: 5 },
      maxLoss: { unit: "percent", value: 10 },
      maxLossMode: "trailing",
      target: { unit: "percent", value: 8 },
      minimumDays: 5,
      countClosed: true,
      countOpenRisk: true,
      timeZone: "America/New_York",
      dayStart: "17:00",
    },
  });
  const base = {
    id: crypto.randomUUID(),
    accountId: account.id,
    account: account.name,
    symbol: "EURUSD",
    direction: "long" as const,
    risk: 100,
    notes: "",
  };
  const trades: Trade[] = [
    {
      ...base,
      openedAt: "2026-11-22T14:00:00Z",
      closedAt: "2026-11-23T18:00:00Z",
      profit: 310,
      commission: -10,
      swap: 0,
    },
    {
      ...base,
      id: crypto.randomUUID(),
      openedAt: "2026-11-23T22:00:00Z",
      closedAt: "2026-11-23T22:30:00Z",
      profit: -145,
      commission: -5,
      swap: 0,
      breakeven: true,
    },
  ];
  const positions: Position[] = [
    {
      ...base,
      id: crypto.randomUUID(),
      openedAt: "2026-11-23T23:00:00Z",
      revision: 1,
    },
    {
      ...base,
      id: crypto.randomUUID(),
      openedAt: "2026-11-23T23:10:00Z",
      revision: 2,
      breakeven: true,
    },
    {
      ...base,
      id: crypto.randomUUID(),
      openedAt: "2026-11-23T23:15:00Z",
      revision: 1,
      risk: null,
    },
  ];
  const movement = (kind: string, amount: number, at: string) =>
    movementSchema.parse({
      id: crypto.randomUUID(),
      revision: 1,
      accountId: account.id,
      kind,
      amount,
      at,
      notes: "",
    });
  const source = {
    trades,
    positions,
    movements: [
      movement("deposit", 1000, "2026-11-22T10:00:00Z"),
      movement("withdrawal", -500, "2026-11-23T20:00:00Z"),
      movement("fee", -20, "2026-11-23T23:00:00Z"),
      movement("correction", 10, "2026-11-23T23:30:00Z"),
      movement("fee", -10, "2026-11-25T00:00:00Z"),
    ],
  };
  const now = "2026-11-24T00:00:00Z";
  const performance = accountPerformance(account, source, now);
  expect(performance).toMatchObject({
    balance: 10640,
    funded: 11000,
    performance: 130,
    performancePeak: 300,
    deposits: 1000,
    withdrawals: 500,
    fees: -20,
    corrections: 10,
    openRisk: 100,
    riskUnknown: 1,
    breakevenPositions: 1,
    positions: 3,
    stats: { count: 2, net: 150, winRate: 0.5 },
  });
  expect(performance.returnRate).toBeCloseTo(130 / 11000);
  expect(performance.maxDrawdown).toBe(170);
  expect(performance.maxDrawdownRate).toBeCloseTo(170 / 11300);
  expect(realizedR(trades[1])).toBe(-1.5);
  expect(accountRuleProgress(account, source, now)).toMatchObject({
    firmDay: "2026-11-23",
    closedToday: -170,
    dailyLimit: 550,
    dailyUsed: 270,
    dailyRemaining: 280,
    dailyIncomplete: true,
    floor: 10200,
    performanceBalance: 11130,
    remaining: 930,
    remainingAtStops: 830,
    maxLossIncomplete: true,
    target: 880,
    targetRemaining: 750,
    tradingDays: 2,
    minimumDays: 5,
  });
  expect(firmDay("2026-11-23T21:59:00Z", "America/New_York", "17:00")).toBe(
    "2026-11-22",
  );
  expect(firmDay("2026-11-23T22:00:00Z", "America/New_York", "17:00")).toBe(
    "2026-11-23",
  );
  expect(firmDay("2026-07-01T21:00:00Z", "America/New_York", "17:00")).toBe(
    "2026-07-01",
  );
});

test("rejects sign errors and malformed firm rules", () => {
  const input = {
    id: crypto.randomUUID(),
    revision: 1,
    accountId: crypto.randomUUID(),
    kind: "deposit",
    amount: -100,
    at: "2026-11-24T08:00:00Z",
    notes: "",
  };
  expect(movementSchema.safeParse(input).success).toBe(false);
  expect(
    movementSchema.safeParse({ ...input, kind: "withdrawal", amount: -100 })
      .success,
  ).toBe(true);
  expect(
    movementSchema.safeParse({ ...input, kind: "fee", amount: 100 }).success,
  ).toBe(false);
});
