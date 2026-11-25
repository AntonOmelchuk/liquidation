import type { Trade } from "../trades/types.ts";
import type { Plan } from "../plans/types.ts";
import type { PlaybookReference } from "../playbooks/types.ts";

import type {
  PLAN_GROUPING,
  R_BUCKET,
  STAT_PERIOD,
  SCENARIO_UNIT,
  TRADE_FACTOR,
  MISTAKE_PERIOD,
  MISTAKE_TREND,
  INSIGHT_ACTION,
} from "./constants.ts";
import type { summarizePlanGroups } from "./plan-analytics.ts";
import type { comparePlanPerformance } from "./plan-performance.ts";
import type { tradeStatistics } from "./trade-statistics.ts";
import type { Journal } from "../journal/types.ts";
import type { MissedTrade } from "../workspace/types.ts";

export type TradeFactor = (typeof TRADE_FACTOR)[keyof typeof TRADE_FACTOR];
export type TradeFactorFilters = Partial<Record<TradeFactor, string>>;
export type TimeWindow = { start?: number; end?: number };
export type OpportunitySource = Pick<
  Journal,
  "plans" | "positions" | "trades"
> & { missedTrades?: readonly MissedTrade[] };
export type TradeStatistics = ReturnType<typeof tradeStatistics>;

export type PlanAnalyticsGrouping =
  (typeof PLAN_GROUPING)[keyof typeof PLAN_GROUPING];
export type PlanCohort = {
  instrument?: string;
  direction?: Plan["setup"]["direction"];
  playbook?: PlaybookReference;
  plans: Plan[];
};
export type PlanAnalyticsRow = ReturnType<typeof summarizePlanGroups>[number];
export type PlanPerformance = ReturnType<typeof comparePlanPerformance>;
export type ChartEvent = {
  timestamp: number;
  realized: number;
  missed: number;
};
export type ScenarioUnit = (typeof SCENARIO_UNIT)[keyof typeof SCENARIO_UNIT];

export type InstrumentTotals = {
  count: number;
  wins: number;
  gains: number;
  losses: number;
};

export type RiskBucket = (typeof R_BUCKET)[keyof typeof R_BUCKET];
export type StatisticsPeriod = (typeof STAT_PERIOD)[keyof typeof STAT_PERIOD];
export type TradeCurvePoint = { timestamp: number; value: number };
export type RiskDrawdown = {
  amount: number;
  peakValue: number;
  peakAt: number | null;
  troughAt: number | null;
  recoveredAt: number | null;
};
export type PriceMetrics = {
  plannedRR: number | null;
  grossR: number | null;
  mfe: number | null;
  mae: number | null;
  givebackR: number | null;
};

export type TradeGroupRecords = { key: string; records: readonly Trade[] };
export type MistakePeriod =
  (typeof MISTAKE_PERIOD)[keyof typeof MISTAKE_PERIOD];
export type MistakeTrend = (typeof MISTAKE_TREND)[keyof typeof MISTAKE_TREND];
export type MistakeSample = {
  count: number;
  occurrences: number;
  rate: number | null;
};
export type MistakeRow = {
  key: string;
  label: string;
  records: Trade[];
  count: number;
  criticalCount: number;
  net: number;
  losses: number;
  rate: number;
  recent: MistakeSample;
  previous: MistakeSample;
  trend: MistakeTrend;
};
export type MistakePeriodRow = {
  key: string;
  closed: number;
  reviewed: number;
  affected: number;
  occurrences: number;
  criticalOccurrences: number;
  rate: number | null;
  records: Trade[];
};
export type InsightAction =
  (typeof INSIGHT_ACTION)[keyof typeof INSIGHT_ACTION];
export type TradeInsight = {
  factor: TradeFactor;
  key: string;
  records: Trade[];
  metrics: TradeStatistics;
  sufficient: boolean;
};

export type InsightRule = Pick<TradeInsight, "factor" | "key">;
