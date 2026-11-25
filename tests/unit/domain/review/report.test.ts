import { expect, test } from "vitest";
import { recentReviewDates } from "@liquidation/domain/review/calendar";
import { REVIEW_GROUP } from "@liquidation/domain/review/constants";
import { modelEvidence } from "@liquidation/domain/review/evidence";
import { buildReview, reviewMetrics } from "@liquidation/domain/review/report";
import type { ReviewQuery } from "@liquidation/domain/review/types";
import type { Position, Trade } from "@liquidation/domain/trades/types";

const trade: Trade = {
  id: "5f8fb96c-48d8-4f99-a5a7-42343f5721da",
  symbol: "EURUSD",
  direction: "long",
  openedAt: "2026-03-28T22:30:00Z",
  closedAt: "2026-03-29T02:00:00Z",
  profit: 100,
  commission: -5,
  swap: -1,
  risk: 25,
  notes: "This stays in the journal",
  account: "Evaluation",
};
const query: ReviewQuery = {
  from: "2026-03-29",
  through: "2026-03-29",
  timeZone: "Europe/Kyiv",
};

test("selects local closing dates and separates account and entry-time groups across DST", () => {
  const crossingMidnight = {
    ...trade,
    account: "evaluation",
    id: "d7b957eb-0ea9-4d5c-a8f1-76c24f48394a",
    direction: "short",
    profit: -20,
    openedAt: "2026-03-28T21:30:00Z",
    closedAt: "2026-03-28T22:30:00Z",
  } satisfies Trade;
  const position: Position = { ...trade, revision: 1 };
  const source = {
    trades: [
      trade,
      crossingMidnight,
      {
        ...trade,
        id: "4ffb4fb9-ec8a-471f-8136-6dddf983be9d",
        account: "Personal",
        symbol: "GBPUSD",
      },
      { ...trade, closedAt: "2026-03-29T21:00:00Z" },
    ],
    positions: [position, { ...position, account: "Personal" }],
  };
  const report = buildReview(source, query);

  expect(report.totals).toMatchObject({ count: 3, net: 162, winRate: 2 / 3 });
  expect(report.openPositions).toBe(2);
  expect(
    report.accounts.find(({ key }) => key === "evaluation")?.metrics,
  ).toMatchObject({ count: 2, net: 68 });
  expect(report.groups[REVIEW_GROUP.WEEKDAYS].map(({ key }) => key)).toEqual([
    "6",
    "7",
  ]);
  expect(report.groups[REVIEW_GROUP.HOURS].map(({ key }) => key)).toEqual([
    "0",
    "23",
  ]);
  expect(report.groups[REVIEW_GROUP.MONTHS][0].key).toBe("2026-03");
  expect(report.groups[REVIEW_GROUP.SYMBOL_SIDES]).toHaveLength(3);
  const account = buildReview(source, { ...query, account: "evaluation" });
  expect(account.records).toEqual([trade, crossingMidnight]);
  expect(account.openPositions).toBe(1);
  expect(
    recentReviewDates(query.timeZone, 7, new Date("2026-03-28T22:30:00Z")),
  ).toEqual({ from: "2026-03-23", through: "2026-03-29" });
});

test("uses net results, recorded risk and a documented break-even threshold", () => {
  const stats = reviewMetrics([
    trade,
    {
      ...trade,
      profit: -40,
      commission: -5,
      swap: -1,
      risk: 40,
      closedAt: "2026-03-29T03:00:00Z",
    },
    { ...trade, profit: 6 },
    { ...trade, profit: 7, risk: 20 },
    { ...trade, profit: 5, risk: null, closedAt: "2026-03-29T04:00:00Z" },
    { ...trade, profit: 8, risk: 20 },
  ]);

  expect(stats).toMatchObject({
    count: 6,
    wins: 3,
    losses: 2,
    flat: 1,
    winRate: 0.5,
    net: 50,
    largestWin: 94,
    largestLoss: -46,
    nearBreakEven: 3,
    countWithRisk: 5,
  });
  expect(stats.totalR).toBeCloseTo(2.76);
});

test("sends only numeric aggregate evidence and generated group identifiers to the model", () => {
  const report = buildReview({ trades: [trade], positions: [] }, query);
  const facts = modelEvidence(report);
  expect(facts[0]).toMatchObject({ id: "F1", count: 1, net: 94, small: true });
  const prompt = JSON.stringify(facts);
  for (const value of [
    trade.id,
    trade.symbol,
    trade.account,
    trade.notes,
    trade.openedAt,
  ]) {
    expect(prompt).not.toContain(value);
  }
});
