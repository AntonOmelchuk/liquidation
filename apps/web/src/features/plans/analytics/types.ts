import type {
  PlanAnalyticsRow,
  PlanPerformance,
  ScenarioUnit,
} from "@liquidation/domain/analytics/types";
import type {
  ExecutionTotals,
  Plan,
  PlanExecution,
  PlanStatus,
} from "@liquidation/domain/plans/types";
import type { Position, Trade } from "@liquidation/domain/trades/types";

import type { DateRange } from "../../../shared/analytics/types.ts";
import type { PLAN_COLUMN } from "./constants.ts";

export type PlanColumn = (typeof PLAN_COLUMN)[keyof typeof PLAN_COLUMN];
export type PlanAnalyticsFilters = {
  dates: DateRange;
  instrument?: string;
  playbook?: string;
  status?: PlanStatus;
  side?: Plan["setup"]["direction"];
};
export type PlanAnalyticsProps = {
  plans: readonly Plan[];
  trades: readonly Trade[];
  positions: readonly Position[];
  execution: ReadonlyMap<string, PlanExecution>;
};
export type PlanCohortTableProps = {
  rows: readonly PlanAnalyticsRow[];
  heading: string;
  selected: string | null;
  onSelect: (key: string | null) => void;
  label: (row: PlanAnalyticsRow) => string;
  execution: PlanAnalyticsProps["execution"];
};

export type OutcomeChartProps = {
  points: PlanPerformance["points"];
  unit: ScenarioUnit;
};

export type PlanPerformancePanelProps = {
  data: PlanPerformance;
  unit?: ScenarioUnit;
};

export type PlanOverviewCardsProps = {
  data: PlanPerformance;
  totalPlans: number;
  executed: readonly ExecutionTotals[];
};
