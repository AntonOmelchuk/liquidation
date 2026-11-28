import type { Plan } from "@liquidation/domain/plans/types";

import { filterPlansByStartDate } from "../list/filters.ts";
import type { PlanAnalyticsFilters } from "./types.ts";

export function planPlaybookKey(plan: Plan) {
  return plan.setup.playbook?.id ?? "";
}

export function filterPlanAnalytics(
  plans: readonly Plan[],
  { dates, instrument, playbook, status, side }: PlanAnalyticsFilters,
) {
  return filterPlansByStartDate(plans, dates).filter(
    (plan) =>
      (instrument === undefined || instrument === plan.setup.symbol) &&
      (playbook === undefined || playbook === planPlaybookKey(plan)) &&
      (status === undefined || status === plan.review.status) &&
      (side === undefined || side === plan.setup.direction),
  );
}
