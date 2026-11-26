import { z } from "zod";
import { screenshotIdsSchema } from "../evidence/screenshots.ts";
import { INSTRUMENT_MARKET } from "../instruments/constants.ts";
import { instrumentSymbolSchema } from "../instruments/symbol.ts";
import { MAX_PLAN_ANALYSIS_BLOCKS } from "../plans/constants.ts";
import { planAnalysisBlockSchema } from "../plans/plan-evidence.ts";
import { playbookReferenceSchema } from "../playbooks/playbook.ts";
import { TRADE_TAG_LIMITS } from "../trades/constants.ts";
import {
  HIGHLIGHT_TYPE,
  WORKSPACE_TEXT_LIMIT,
  WORKSPACE_TITLE_LIMIT,
} from "./constants.ts";

const analysis = z
  .array(planAnalysisBlockSchema)
  .max(MAX_PLAN_ANALYSIS_BLOCKS)
  .refine(
    (blocks) => new Set(blocks.map(({ id }) => id)).size === blocks.length,
    "Analysis blocks must have distinct IDs.",
  );

export const highlightInputSchema = z.object({
  featured: z.boolean(),
  note: z.string().trim().max(WORKSPACE_TEXT_LIMIT),
  example: z
    .object({
      title: z.string().trim().min(1).max(WORKSPACE_TITLE_LIMIT),
      symbol: instrumentSymbolSchema.optional(),
    })
    .optional(),
  details: z
    .object({
      date: z.iso.date().optional(),
      market: z.enum(INSTRUMENT_MARKET).optional(),
      style: z.string().trim().min(1).max(TRADE_TAG_LIMITS.style).optional(),
      timeframe: z.string().trim().min(1).max(24).optional(),
      model: z.string().trim().min(1).max(WORKSPACE_TITLE_LIMIT).optional(),
      playbook: playbookReferenceSchema.optional(),
      rr: z.number().nonnegative().optional(),
      type: z.enum(HIGHLIGHT_TYPE).optional(),
    })
    .optional(),
  analysis: analysis.optional(),
  screenshotIds: screenshotIdsSchema.optional(),
});

export function highlightScreenshotIds(
  entry?: Pick<
    z.infer<typeof highlightInputSchema>,
    "analysis" | "screenshotIds"
  >,
) {
  return [
    ...(entry?.screenshotIds ?? []),
    ...(entry?.analysis?.flatMap(({ screenshotIds }) => screenshotIds) ?? []),
  ];
}
