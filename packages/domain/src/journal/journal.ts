import { z } from "zod";
import {
  accountSchema,
  currencySchema,
  movementSchema,
} from "../accounts/account.ts";
import { DEFAULT_CURRENCY } from "../accounts/constants.ts";
import { backtestSchema } from "../backtests/backtest.ts";
import { planSchema } from "../plans/plan.ts";
import { playbookSchema } from "../playbooks/playbook.ts";
import { positionSchema } from "../trades/position.ts";
import { tradeSchema } from "../trades/trade.ts";
import { workspaceSchema } from "../workspace/workspace.ts";
import { JOURNAL_ROUTES, JOURNAL_VERSION } from "./constants.ts";
import { trashEntrySchema } from "./trash/trash.ts";

export function isJournalRoute(path: string | undefined) {
  return (
    path === JOURNAL_ROUTES.trades ||
    path === JOURNAL_ROUTES.aiReview ||
    path === JOURNAL_ROUTES.positions ||
    path === JOURNAL_ROUTES.plans ||
    path === JOURNAL_ROUTES.playbooks ||
    path === JOURNAL_ROUTES.backtests ||
    path === JOURNAL_ROUTES.tradeLinks ||
    path === JOURNAL_ROUTES.workspace ||
    path === JOURNAL_ROUTES.accounts ||
    path === JOURNAL_ROUTES.trash ||
    Boolean(path?.startsWith(JOURNAL_ROUTES.planScreenshot))
  );
}

export const journalSchema = z.object({
  version: z.literal(JOURNAL_VERSION),
  currency: currencySchema.default(DEFAULT_CURRENCY),
  accounts: z.array(accountSchema).default([]),
  movements: z.array(movementSchema).default([]),
  trades: z.array(tradeSchema),
  positions: z.array(positionSchema).default([]),
  plans: z.array(planSchema).default([]),
  playbooks: z.array(playbookSchema).default([]),
  backtests: z.array(backtestSchema).default([]),
  workspace: workspaceSchema.prefault({}),
  trash: z.array(trashEntrySchema).default([]),
});
