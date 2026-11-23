import { TRADE_SIDE } from "../trades/constants.ts";
import { PLAN_EVENT, PLAN_NARRATIVE, PLAN_PERIOD } from "./constants.ts";
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

export function getPlanPeriod(plan: Plan, today: string) {
  if (getPlanVoiding(plan)) return PLAN_PERIOD.PAST;
  const end = plan.setup.endsOn ?? plan.setup.startsOn;
  return end && end < today ? PLAN_PERIOD.PAST : PLAN_PERIOD.CURRENT;
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
