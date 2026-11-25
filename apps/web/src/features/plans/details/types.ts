import type {
  PLAN_ACTION,
  PLAN_EVENT,
} from "@liquidation/domain/plans/constants";
import type {
  Plan,
  PlanEvent,
  PlanExecution,
  PlanSetup,
} from "@liquidation/domain/plans/types";
import type { Position, Trade } from "@liquidation/domain/trades/types";

export type PlanLinkedTradesProps = {
  planId: string;
  data: PlanExecution;
  trades: readonly Trade[];
  positions: readonly Position[];
};

export type PlanStatusChipProps = {
  plan: Plan;
  compact?: boolean;
};

export type PlanSpanProps = { setup: PlanSetup; compact?: boolean };

export type PlanNarrativeLabelProps = { setup: PlanSetup };

export type Activity =
  | typeof PLAN_ACTION.ADD_UPDATE
  | typeof PLAN_ACTION.VOID
  | typeof PLAN_ACTION.RESTORE
  | Extract<PlanEvent, { kind: typeof PLAN_EVENT.UPDATE }>;

export type ActivityFormProps = {
  plan: Plan;
  activity: Activity;
  finish: () => void;
};

export type PlanActivityProps = { plan: Plan };
