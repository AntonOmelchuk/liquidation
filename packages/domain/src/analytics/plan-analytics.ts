import type { Plan } from "../plans/types.ts";
import { PLAN_STATUS } from "../plans/constants.ts";
import type { Position, Trade } from "../trades/types.ts";
import type { MissedTrade } from "../workspace/types.ts";

import { comparePlanPerformance } from "./plan-performance.ts";

import { PLAN_GROUPING } from "./constants.ts";
import type { PlanAnalyticsGrouping, PlanCohort } from "./types.ts";

export function summarizePlanGroups(
  {
    plans,
    trades,
    positions,
    missedTrades = [],
  }: {
    plans: readonly Plan[];
    trades: readonly Trade[];
    positions: readonly Position[];
    missedTrades?: readonly MissedTrade[];
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
    const key = JSON.stringify([instrument, playbook?.id, direction]);
    const cohort = cohorts.get(key);
    if (cohort) cohort.plans.push(plan);
    else cohorts.set(key, { instrument, playbook, direction, plans: [plan] });
  }

  const tradesByPlan = Map.groupBy(trades, (trade) => trade.planId);
  const positionsByPlan = Map.groupBy(positions, (position) => position.planId);
  const missesByPlan = Map.groupBy(missedTrades, (miss) => miss.planId);
  return [...cohorts]
    .map(([key, cohort]) => {
      const linkedTrades = cohort.plans.flatMap(
        ({ id }) => tradesByPlan.get(id) ?? [],
      );
      const linkedPositions = cohort.plans.flatMap(
        ({ id }) => positionsByPlan.get(id) ?? [],
      );
      const linkedMisses = cohort.plans.flatMap(({ id, review }) =>
        "outcome" in review ? (missesByPlan.get(id) ?? []) : [],
      );
      const result = comparePlanPerformance({
        plans: cohort.plans,
        trades: linkedTrades,
        positions: linkedPositions,
        missedTrades: linkedMisses,
      });
      const measured = linkedTrades.length - result.tradesWithoutRisk;

      return {
        key,
        ...cohort,
        worked: result.worked,
        reviewed: result.decided,
        allPlanWinRate: result.allPlanWinRate,
        winRate: result.planWinRate,
        closed: linkedTrades.length,
        measured,
        realizedR: measured ? result.realized : null,
        missed:
          result.statuses[PLAN_STATUS.MISSED] +
          result.statuses[PLAN_STATUS.WORKED_WITHOUT_ENTRY],
        assessedMisses: result.assessedMisses,
        missedR: result.assessedMisses ? result.missed : null,
      };
    })
    .sort(
      (a, b) => b.plans.length - a.plans.length || a.key.localeCompare(b.key),
    );
}
