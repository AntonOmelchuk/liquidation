import type { Journal } from "../journal/types.ts";
import { PLAN_STATUS, PLAN_STATUSES } from "../plans/constants.ts";
import type { PlanStatus } from "../plans/types.ts";
import type { ChartEvent, TimeWindow } from "./types.ts";

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

export function comparePlanPerformance(
  { plans, positions, trades }: Pick<Journal, "plans" | "positions" | "trades">,
  { start = -Infinity, end = Infinity }: TimeWindow = {},
) {
  const linkedPlans = new Set<string>();
  const events: ChartEvent[] = [];
  const cashEvents: ChartEvent[] = [];
  let tradesWithoutRisk = 0;
  let missesWithoutRisk = 0;

  for (const position of positions) {
    if (position.planId) linkedPlans.add(position.planId);
  }
  for (const trade of trades) {
    if (trade.planId) linkedPlans.add(trade.planId);
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
  for (const { id, review } of plans) {
    statuses[review.status]++;
    if (review.status !== PLAN_STATUS.MISSED || review.outcome === null)
      continue;
    const { closedAt, netR, risk } = review.outcome;
    const timestamp = Date.parse(closedAt);
    if (timestamp < start || timestamp >= end) continue;
    if (linkedPlans.has(id)) {
      linkedMisses++;
      continue;
    }

    assessedMisses++;
    if (netR > 0) winningMisses++;
    events.push({ timestamp, realized: 0, missed: netR });
    if (risk === undefined) missesWithoutRisk++;
    else {
      const cents =
        Math.sign(netR) * Math.round(Math.abs(netR) * Math.round(risk * 100));
      cashEvents.push({ timestamp, realized: 0, missed: cents });
    }
  }

  const decided = statuses.worked + statuses.failed;
  return {
    statuses,
    decided,
    planWinRate: decided ? statuses.worked / decided : null,
    missedWinRate: assessedMisses ? winningMisses / assessedMisses : null,
    assessedMisses,
    linkedMisses,
    tradesWithoutRisk,
    missesWithoutRisk,
    ...cumulative(events, 1),
    cash: cumulative(cashEvents, 100),
  };
}
