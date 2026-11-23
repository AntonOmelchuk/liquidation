import type { PlaybookLimits } from "@liquidation/domain/playbooks/types";

export const LIMIT_NAMES = [
  "maxInitialRisk",
  "maxTradesWeek",
  "maxTradesMonth",
  "maxWeekLossR",
  "maxOpen",
  "maxHoldHours",
  "minPlannedRR",
] as const satisfies readonly (keyof PlaybookLimits)[];

export const COUNT_LIMITS: ReadonlySet<keyof PlaybookLimits> = new Set([
  "maxTradesWeek",
  "maxTradesMonth",
  "maxOpen",
]);
