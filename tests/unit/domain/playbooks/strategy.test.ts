import {
  emptyPlaybookStrategy,
  forecastStrategy,
  playbookStrategySchema,
} from "@liquidation/domain/playbooks/strategy";
import { expect, test } from "vitest";

test("forecasts fixed risk from configured trades, win rate and time off", () => {
  const { risk } = emptyPlaybookStrategy();
  expect(forecastStrategy(risk)).toMatchObject({
    trades: 191,
    wins: 96,
    losses: 95,
    expectancyR: 1,
    capital: 29_100,
  });
  const empty = forecastStrategy({ ...risk, monthsOff: risk.months });
  expect(empty).toMatchObject({
    trades: 0,
    wins: 0,
    losses: 0,
    returnRate: 0,
    capital: risk.capital,
  });
  expect(
    forecastStrategy({ ...risk, winPercent: 40, rewardR: 1 }).expectancyR,
  ).toBeCloseTo(-0.2);
});

test("rejects invalid branches, normalized duplicate symbols and inverted monthly targets", () => {
  const strategy = emptyPlaybookStrategy();
  const id = crypto.randomUUID();
  expect(
    playbookStrategySchema.safeParse({
      ...strategy,
      symbols: ["eurusd", "EURUSD"],
    }).success,
  ).toBe(false);
  expect(
    playbookStrategySchema.safeParse({
      ...strategy,
      decisions: [{ id, label: "Entry", detail: "", onNo: id }],
    }).success,
  ).toBe(false);
  expect(
    playbookStrategySchema.safeParse({
      ...strategy,
      limits: { monthlyTargetLow: 8, monthlyTargetHigh: 4 },
    }).success,
  ).toBe(false);
  expect(
    playbookStrategySchema.parse({ ...strategy, symbols: [" eurusd "] })
      .symbols,
  ).toEqual(["EURUSD"]);
});
