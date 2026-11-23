import type { PLAN_PERIOD } from "@liquidation/domain/plans/constants";
import type {
  Plan,
  PlanExecution,
  PlanStatus,
} from "@liquidation/domain/plans/types";
import type { FILTER_ALL } from "../../../shared/constants.ts";
import type { PLAN_SORTS } from "./constants.ts";

export type PlanGroup = {
  period: typeof PLAN_PERIOD.CURRENT | typeof PLAN_PERIOD.PAST;
  plans: readonly Plan[];
};

export type PlanRowProps = {
  plan: Plan;
  actual?: PlanExecution["actual"];
};

export type PlansTableProps = {
  groups: readonly PlanGroup[];
  execution: ReadonlyMap<string, PlanExecution>;
  label?: string;
};

export type PlanSort = (typeof PLAN_SORTS)[number];

export type PlanFilters = {
  query: string;
  status: PlanStatus | typeof FILTER_ALL;
  sort: PlanSort;
};
