import type { Plan } from "../plans/types.ts";
import type { Position, Trade } from "../trades/types.ts";

import { comparePlanPerformance } from "./plan-performance.ts";

import { PLAN_GROUPING } from "./constants.ts";
import type { PlanAnalyticsGrouping, PlanCohort } from "./types.ts";

export function summarizePlanGroups(
  {
    plans,
    trades,
    positions,
  }: {
    plans: readonly Plan[];
    trades: readonly Trade[];
    positions: readonly Position[];
  },
  grouping: PlanAnalyticsGrouping,
) {
  const cohorts = new Map<string, PlanCohort>();
  for (const plan of plans) {
    const { symbol, playbook: reference, direction: side } = plan.setup;
    const combined = grouping === PLAN_GROUPING.COMBINED;
    const instrument =
      combined || grouping === PLAN_GROUPING.INSTRUMENT ? symbol : undefined;
    const playbook =
      combined || grouping === PLAN_GROUPING.PLAYBOOK ? reference : undefined;
    const direction = grouping === PLAN_GROUPING.SIDE ? side : undefined;
    const key = JSON.stringify([
      instrument,
      playbook?.id,
      playbook?.version,
      direction,
    ]);
    const cohort = cohorts.get(key);
    if (cohort) cohort.plans.push(plan);
    else cohorts.set(key, { instrument, playbook, direction, plans: [plan] });
  }

  const tradesByPlan = Map.groupBy(trades, (trade) => trade.planId);
  const positionsByPlan = Map.groupBy(positions, (position) => position.planId);
  return [...cohorts]
    .map(([key, cohort]) => {
      const linkedTrades = cohort.plans.flatMap(
        ({ id }) => tradesByPlan.get(id) ?? [],
      );
      const linkedPositions = cohort.plans.flatMap(
        ({ id }) => positionsByPlan.get(id) ?? [],
      );
      const result = comparePlanPerformance({
        plans: cohort.plans,
        trades: linkedTrades,
        positions: linkedPositions,
      });
      const measured = linkedTrades.length - result.tradesWithoutRisk;

      return {
        key,
        ...cohort,
        worked: result.statuses.worked,
        reviewed: result.decided,
        winRate: result.planWinRate,
        closed: linkedTrades.length,
        measured,
        realizedR: measured ? result.realized : null,
        missed: result.statuses.missed,
        assessedMisses: result.assessedMisses,
        missedR: result.assessedMisses ? result.missed : null,
      };
    })
    .sort(
      (a, b) => b.plans.length - a.plans.length || a.key.localeCompare(b.key),
    );
}
