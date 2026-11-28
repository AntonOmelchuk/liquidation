import { PLAN_STATUS, PLAN_STATUSES } from "../plans/constants.ts";
import type { PlanStatus } from "../plans/types.ts";
import type { ChartEvent, OpportunitySource, TimeWindow } from "./types.ts";
import { isBreakevenReviewReason } from "../workspace/planning.ts";
import type { MissedTrade } from "../workspace/types.ts";

import { netCents, realizedR } from "../trades/trade.ts";

function cumulative(events: ChartEvent[], units: number) {
  let realized = 0;
  let missed = 0;
  const points: { timestamp: number; realized: number; scenario: number }[] =
    [];
  events.sort((a, b) => a.timestamp - b.timestamp);
  for (const event of events) {
    realized += event.realized;
    missed += event.missed;
    const point = {
      timestamp: event.timestamp,
      realized: realized / units,
      scenario: (realized + missed) / units,
    };
    if (points.at(-1)?.timestamp === event.timestamp)
      points[points.length - 1] = point;
    else points.push(point);
  }
  return {
    realized: realized / units,
    missed: missed / units,
    scenario: (realized + missed) / units,
    points,
  };
}

export function estimatedMissedCents(
  outcome: NonNullable<MissedTrade["outcome"]>,
) {
  return outcome.risk === undefined
    ? null
    : Math.sign(outcome.netR) *
        Math.round(Math.abs(outcome.netR) * Math.round(outcome.risk * 100));
}

export function missedTradeEstimate({
  reason,
  outcome,
}: Pick<MissedTrade, "reason" | "outcome">) {
  if (!outcome) return { netR: null, cash: null };
  const direction = isBreakevenReviewReason(reason) ? -1 : 1;
  const cents = estimatedMissedCents(outcome);
  return {
    netR: direction * outcome.netR,
    cash: cents === null ? null : (direction * cents) / 100,
  };
}

export function executedPlanIds({
  trades,
  positions,
}: Pick<OpportunitySource, "trades" | "positions">) {
  return new Set(
    [...trades, ...positions].flatMap(({ planId }) => (planId ? [planId] : [])),
  );
}

export function comparePlanPerformance(
  { plans, positions, trades, missedTrades = [] }: OpportunitySource,
  { start = -Infinity, end = Infinity }: TimeWindow = {},
) {
  const linkedPlans = executedPlanIds({ trades, positions });
  const events: ChartEvent[] = [];
  const cashEvents: ChartEvent[] = [];
  let tradesWithoutRisk = 0;
  let missesWithoutRisk = 0;

  for (const trade of trades) {
    const timestamp = Date.parse(trade.closedAt);
    if (timestamp < start || timestamp >= end) continue;
    const result = realizedR(trade);
    cashEvents.push({ timestamp, realized: netCents(trade), missed: 0 });
    if (result === null) tradesWithoutRisk++;
    else events.push({ timestamp, realized: result, missed: 0 });
  }

  const statuses = Object.fromEntries(
    PLAN_STATUSES.map((status) => [status, 0]),
  ) as Record<PlanStatus, number>;
  let assessedMisses = 0;
  let winningMisses = 0;
  let linkedMisses = 0;
  const opportunities = missedTrades.filter(
    ({ reason }) => !isBreakevenReviewReason(reason),
  );
  const explicitPlans = new Set(
    opportunities.flatMap(({ planId }) => (planId ? [planId] : [])),
  );
  let replacedPlanMisses = 0;
  let recordedMisses = 0;

  function addMiss(
    outcome: NonNullable<MissedTrade["outcome"]>,
    planId?: string,
  ) {
    const timestamp = Date.parse(outcome.closedAt);
    if (timestamp < start || timestamp >= end) return false;
    if (planId && linkedPlans.has(planId)) {
      linkedMisses++;
      return false;
    }
    assessedMisses++;
    if (outcome.netR > 0) winningMisses++;
    events.push({ timestamp, realized: 0, missed: outcome.netR });
    const cents = estimatedMissedCents(outcome);
    if (cents === null) missesWithoutRisk++;
    else cashEvents.push({ timestamp, realized: 0, missed: cents });
    return true;
  }

  for (const { id, review } of plans) {
    statuses[review.status]++;
    if (!("outcome" in review) || !review.outcome) continue;
    if (explicitPlans.has(id)) {
      const at = Date.parse(review.outcome.closedAt);
      if (at >= start && at < end) replacedPlanMisses++;
      continue;
    }
    addMiss(review.outcome, id);
  }
  for (const { outcome, planId } of opportunities) {
    if (outcome && addMiss(outcome, planId)) recordedMisses++;
  }

  const worked =
    statuses[PLAN_STATUS.WORKED] + statuses[PLAN_STATUS.WORKED_WITHOUT_ENTRY];
  const decided = worked + statuses[PLAN_STATUS.FAILED];
  return {
    statuses,
    worked,
    decided,
    allPlanWinRate: plans.length ? worked / plans.length : null,
    planWinRate: decided ? worked / decided : null,
    missedWinRate: assessedMisses ? winningMisses / assessedMisses : null,
    assessedMisses,
    linkedMisses,
    replacedPlanMisses,
    recordedMisses,
    tradesWithoutRisk,
    missesWithoutRisk,
    ...cumulative(events, 1),
    cash: cumulative(cashEvents, 100),
  };
}
