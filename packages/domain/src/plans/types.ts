import type { z } from "zod";
import type {
  planAnalysisBlockSchema,
  planEventSchema,
  planNoteSchema,
} from "./plan-evidence.ts";
import type { planExecution } from "./plan-execution.ts";
import type {
  planCommand,
  planReviewSchema,
  planSchema,
  planSetupSchema,
  planTradeChangeSchema,
} from "./plan.ts";

export type PlanStatus = z.infer<typeof planReviewSchema>["status"];

export type Plan = z.infer<typeof planSchema>;

export type PlanSetup = z.infer<typeof planSetupSchema>;

export type PlanCommand = z.infer<typeof planCommand>;

export type PlanTradeChange = z.infer<typeof planTradeChangeSchema>;

export type ExecutionTotals = {
  count: number;
  closed: number;
  open: number;
  wins: number;
  losses: number;
  flat: number;
  net: number;
  totalR: number | null;
  missingRisk: number;
  winRate: number | null;
};

export type PlanExecution = ReturnType<typeof planExecution>;

export type PlanNote = z.infer<typeof planNoteSchema>;

export type PlanAnalysisBlock = z.infer<typeof planAnalysisBlockSchema>;

export type PlanEvent = z.infer<typeof planEventSchema>;
