import {
  INSIGHT_ACTION,
  MISTAKE_PERIOD,
  MISTAKE_TREND,
  TRADE_FACTOR,
} from "@liquidation/domain/analytics/constants";
import { selectedGroupTrades } from "@liquidation/domain/analytics/group-selection";
import {
  mistakeAnalytics,
  mistakePeriods,
} from "@liquidation/domain/analytics/mistake-analytics";
import {
  filterStatisticTrades,
  tradeBreakdown,
} from "@liquidation/domain/analytics/trade-factors";
import {
  simulateInsights,
  tradeInsights,
} from "@liquidation/domain/analytics/trade-insights";
import { tradeStatistics } from "@liquidation/domain/analytics/trade-statistics";
import { tradeInput } from "@liquidation/domain/trades/trade";
import type { Trade } from "@liquidation/domain/trades/types";
import { expect, test } from "vitest";

function record(index: number, fields: Partial<Trade> = {}): Trade {
  const date = new Date(Date.UTC(2026, 0, 1 + index, 10));
  return {
    id: "00000000-0000-4000-8000-" + String(index).padStart(12, "0"),
    symbol: "EURUSD",
    direction: "long",
    timeframe: "M15",
    session: "LKZ",
    openedAt: date.toISOString(),
    closedAt: new Date(date.getTime() + 3600000).toISOString(),
    profit: 11,
    commission: -1,
    swap: 0,
    risk: 10,
    notes: "",
    ...fields,
  };
}

test("month of year groups combine the same month from different years and can be restricted by year", () => {
  const a = record(1, {
    openedAt: "2025-11-11T10:00:00Z",
    closedAt: "2025-11-11T11:00:00Z",
  });
  const b = record(2, {
    openedAt: "2026-11-11T10:00:00Z",
    closedAt: "2026-11-11T11:00:00Z",
    profit: -4,
  });
  const c = record(3, {
    openedAt: "2026-12-11T10:00:00Z",
    closedAt: "2026-12-11T11:00:00Z",
  });
  expect(tradeBreakdown([a, b, c], TRADE_FACTOR.MONTH)).toMatchObject([
    { key: "11", metrics: { count: 2, net: 5 } },
    { key: "12", metrics: { count: 1, net: 10 } },
  ]);
  expect(
    filterStatisticTrades([a, b, c], {}, { month: "11", year: "2026" }),
  ).toEqual([b]);
});

test("selected group totals deduplicate overlapping mistake tags and recompute ratios", () => {
  const a = record(1, { mistakes: ["Early entry", "FOMO"], profit: 21 });
  const b = record(2, { mistakes: ["FOMO"], profit: -9 });
  const c = record(3);
  const groups = tradeBreakdown([a, b, c], TRADE_FACTOR.MISTAKE);
  const selected = selectedGroupTrades(
    groups,
    new Set(["early entry", "fomo"]),
  );
  expect(selected.map(({ id }) => id)).toEqual([a.id, b.id]);
  expect(tradeStatistics(selected)).toMatchObject({
    count: 2,
    net: 10,
    winRate: 0.5,
    profitFactor: 2,
  });
  expect(selectedGroupTrades(groups, new Set())).toEqual([]);
});

test("mistake review schema keeps old records valid and validates the critical subset", () => {
  const legacy = record(1);
  expect(tradeInput.safeParse(legacy).success).toBe(true);
  const reviewed = tradeInput.parse({
    ...legacy,
    mistakes: [" Early entry ", "early entry"],
    criticalMistakes: ["EARLY ENTRY"],
    mistakesReviewed: true,
    reviewNotes: "Wait for confirmation.",
  });
  expect(reviewed.mistakes).toEqual(["Early entry"]);
  expect(reviewed.criticalMistakes).toEqual(["EARLY ENTRY"]);
  expect(
    tradeInput.safeParse({
      ...legacy,
      mistakes: ["FOMO"],
      criticalMistakes: ["Early entry"],
    }).success,
  ).toBe(false);
});

test("mistake trends compare reviewed samples, distinguish repeat tags and critical trades, and count each tag once", () => {
  const trades = Array.from({ length: 40 }, (_, index) => {
    const earlier = index < 20;
    const tag = earlier ? index < 10 : index < 24;
    return record(index, {
      mistakesReviewed: true,
      mistakes: tag
        ? ["Early entry", "early entry", ...(index === 0 ? ["FOMO"] : [])]
        : undefined,
      criticalMistakes: index === 0 ? ["FOMO"] : undefined,
      profit: index === 0 ? -9 : 11,
    });
  });
  trades.push(record(41));
  const report = mistakeAnalytics(trades);
  expect(report).toMatchObject({
    closed: 41,
    reviewed: 40,
    affected: 14,
    critical: 1,
    occurrences: 15,
    criticalOccurrences: 1,
    recurring: 1,
    recentCount: 20,
    previousCount: 20,
  });
  expect(report.rows.find((row) => row.key === "early entry")).toMatchObject({
    count: 14,
    criticalCount: 0,
    recent: { count: 20, occurrences: 4, rate: 0.2 },
    previous: { count: 20, occurrences: 10, rate: 0.5 },
    trend: MISTAKE_TREND.DECREASED,
  });
  expect(report.rows.find((row) => row.key === "fomo")).toMatchObject({
    count: 1,
    criticalCount: 1,
    net: -10,
    losses: -10,
  });
  expect(mistakeAnalytics([trades[0]]).rows[0].trend).toBe(
    MISTAKE_TREND.UNKNOWN,
  );
  const periods = mistakePeriods(trades, MISTAKE_PERIOD.MONTH, "fomo");
  const january = periods.find((row) => row.key === "2026-01")!;
  expect(january).toMatchObject({
    closed: 31,
    reviewed: 31,
    affected: 1,
    occurrences: 1,
    criticalOccurrences: 1,
    rate: 1 / 31,
  });
  expect(periods.find((row) => row.key === "2026-02")).toMatchObject({
    closed: 10,
    reviewed: 9,
    affected: 0,
    occurrences: 0,
  });
});

test("local insights flag small groups and apply combined exclusions to original trades exactly once", () => {
  const winners = Array.from({ length: 20 }, (_, i) =>
    record(i, { timeframe: "H4", session: "NYKZ" }),
  );
  const losers = [
    record(20, { profit: -19, timeframe: "M5", session: "LKZ" }),
    record(21, { profit: -9, timeframe: "M5", session: "LKZ" }),
  ];
  const trades = [...winners, ...losers];
  const rows = tradeInsights(trades);
  expect(
    rows.find(
      (row) => row.factor === TRADE_FACTOR.TIMEFRAME && row.key === "H4",
    ),
  ).toMatchObject({
    sufficient: true,
    metrics: { count: 20, net: 200, expectancy: 10 },
  });
  expect(
    rows.find(
      (row) => row.factor === TRADE_FACTOR.TIMEFRAME && row.key === "M5",
    ),
  ).toMatchObject({
    sufficient: false,
    metrics: { count: 2, net: -30, expectancy: -15 },
  });
  const rules = [
    { factor: TRADE_FACTOR.TIMEFRAME, key: "M5" },
    { factor: TRADE_FACTOR.SESSION, key: "LKZ" },
  ];
  const simulation = simulateInsights(trades, rules, INSIGHT_ACTION.EXCLUDE);
  expect(simulation.kept).toEqual(winners);
  expect(simulation.excluded).toEqual(losers);
  expect(simulation.actual).toMatchObject({ count: 22, net: 170 });
  expect(simulation.scenario).toMatchObject({
    count: 20,
    net: 200,
    maxDrawdown: 0,
  });
  expect(simulateInsights(trades, rules, INSIGHT_ACTION.INCLUDE).kept).toEqual(
    losers,
  );
});
