import {
  PLAN_PERIOD,
  PLAN_STATUSES,
} from "@liquidation/domain/plans/constants";
import type { Plan } from "@liquidation/domain/plans/types";
import { FILTER_ALL } from "../../../shared/constants.ts";
import type { PlanFilters } from "./types.ts";

import { getPlanPeriod } from "@liquidation/domain/plans/plan-lifecycle";
import { isoToLocalDateTime } from "../../../shared/format.ts";

export function filterPlans(
  plans: readonly Plan[],
  { query, status, sort }: PlanFilters,
) {
  const term = query.trim().toUpperCase();
  const newestFirst = (a: Plan, b: Plan) =>
    b.createdAt.localeCompare(a.createdAt);
  const sorters = {
    latest: newestFirst,
    earliest: (a: Plan, b: Plan) => newestFirst(b, a),
    symbol: (a: Plan, b: Plan) =>
      a.setup.symbol.localeCompare(b.setup.symbol) || newestFirst(a, b),
    status: (a: Plan, b: Plan) =>
      PLAN_STATUSES.indexOf(a.review.status) -
        PLAN_STATUSES.indexOf(b.review.status) || newestFirst(a, b),
  };
  return plans
    .filter(
      ({ setup, review }) =>
        (status === FILTER_ALL || status === review.status) &&
        (setup.symbol.includes(term) ||
          setup.title.toUpperCase().includes(term)),
    )
    .sort(sorters[sort]);
}

export function filterPlansByStartDate(
  plans: readonly Plan[],
  { from, through }: { from: string; through: string },
) {
  if (!from && !through) return plans;
  return plans.filter(({ setup, createdAt }) => {
    const start = setup.startsOn ?? isoToLocalDateTime(createdAt).slice(0, 10);
    return (!from || start >= from) && (!through || start <= through);
  });
}

export function planTableGroups(plans: readonly Plan[], today: string) {
  const grouped = Map.groupBy(plans, (plan) => getPlanPeriod(plan, today));
  return ([PLAN_PERIOD.CURRENT, PLAN_PERIOD.PAST] as const).flatMap(
    (period) => {
      const rows = grouped.get(period);
      return rows?.length ? [{ period, plans: rows }] : [];
    },
  );
}
