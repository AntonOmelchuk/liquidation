import { TRADE_SIDE } from "../trades/constants.ts";
import {
  PLAN_EVENT,
  PLAN_NARRATIVE,
  PLAN_OPPORTUNITY_STATUSES,
  PLAN_PERIOD,
  PLAN_STATUS,
} from "./constants.ts";
import type { Plan, PlanSetup } from "./types.ts";

export function getPlanNarrative(setup: PlanSetup) {
  return (
    setup.narrative ??
    (setup.direction === TRADE_SIDE.LONG
      ? PLAN_NARRATIVE.BULLISH
      : PLAN_NARRATIVE.BEARISH)
  );
}

export function getPlanVoiding(plan: Plan) {
  const event = plan.events?.findLast(({ kind }) => kind !== PLAN_EVENT.UPDATE);
  return event?.kind === PLAN_EVENT.VOID ? event : undefined;
}

export function isOpenPlan(plan: Plan) {
  const { status } = plan.review;
  return (
    (status === PLAN_STATUS.WAITING || status === PLAN_STATUS.IN_PROGRESS) &&
    !getPlanVoiding(plan)
  );
}

export function isPlanOpportunityStatus(status: unknown) {
  return PLAN_OPPORTUNITY_STATUSES.some((value) => value === status);
}

export function getPlanPeriod(plan: Plan) {
  return isOpenPlan(plan) ? PLAN_PERIOD.CURRENT : PLAN_PERIOD.PAST;
}

export function canLinkPlan(plan: Plan, entryDay: string) {
  if (getPlanVoiding(plan)) return false;
  const { startsOn, endsOn } = plan.setup;
  return (
    !startsOn || (startsOn <= entryDay && entryDay <= (endsOn ?? startsOn))
  );
}

export function planScreenshotIds(plan: Plan) {
  const ids = new Set<string>();
  for (const setup of [plan.setup, plan.originalSetup]) {
    for (const id of setup?.screenshotIds ?? []) ids.add(id);
    for (const block of setup?.analysis ?? []) {
      for (const id of block.screenshotIds) ids.add(id);
    }
  }
  for (const id of plan.recap?.screenshotIds ?? []) ids.add(id);
  for (const event of plan.events ?? []) {
    if (event.kind === PLAN_EVENT.UPDATE) {
      for (const id of event.note.screenshotIds) ids.add(id);
    }
  }
  return ids;
}
