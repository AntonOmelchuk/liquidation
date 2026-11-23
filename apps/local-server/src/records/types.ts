import type { PLAN_ACTION } from "@liquidation/domain/plans/constants";
import type { PlanCommand } from "@liquidation/domain/plans/types";

export type PlanEdit = Exclude<
  PlanCommand,
  { action: typeof PLAN_ACTION.CREATE }
>;
