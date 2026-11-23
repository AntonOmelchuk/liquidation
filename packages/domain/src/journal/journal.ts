import { z } from "zod";
import { backtestSchema } from "../backtests/backtest.ts";
import { planSchema } from "../plans/plan.ts";
import { playbookSchema } from "../playbooks/playbook.ts";
import { positionSchema } from "../trades/position.ts";
import { tradeSchema } from "../trades/trade.ts";
import { JOURNAL_ROUTES, JOURNAL_VERSION } from "./constants.ts";

export function isJournalRoute(path: string | undefined) {
  return (
    path === JOURNAL_ROUTES.trades ||
    path === JOURNAL_ROUTES.positions ||
    path === JOURNAL_ROUTES.plans ||
    path === JOURNAL_ROUTES.playbooks ||
    path === JOURNAL_ROUTES.backtests ||
    path === JOURNAL_ROUTES.tradeLinks ||
    Boolean(path?.startsWith(JOURNAL_ROUTES.planScreenshot))
  );
}

export const journalSchema = z.object({
  version: z.literal(JOURNAL_VERSION),
  trades: z.array(tradeSchema),
  positions: z.array(positionSchema).default([]),
  plans: z.array(planSchema).default([]),
  playbooks: z.array(playbookSchema).default([]),
  backtests: z.array(backtestSchema).default([]),
});
