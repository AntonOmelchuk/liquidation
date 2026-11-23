import type { Plan } from "../plans/types.ts";
import type { PlaybookReference } from "../playbooks/types.ts";

import type {
  PLAN_GROUPING,
  SCENARIO_UNIT,
  TRADE_FACTOR,
} from "./constants.ts";
import type { summarizePlanGroups } from "./plan-analytics.ts";
import type { comparePlanPerformance } from "./plan-performance.ts";
import type { tradeStatistics } from "./trade-statistics.ts";

export type TradeFactor = (typeof TRADE_FACTOR)[keyof typeof TRADE_FACTOR];
export type TradeFactorFilters = Partial<Record<TradeFactor, string>>;
export type TimeWindow = { start?: number; end?: number };
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
