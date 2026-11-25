import { z } from "zod";
import { playbookLinkSchema } from "../playbooks/playbook.ts";
import { tradeTagsSchema } from "./trade-tags.ts";
import { tradePricesSchema } from "./prices.ts";
import { tradeEvidenceShape } from "./trade-evidence.ts";
import { validMistakeReview } from "./mistakes.ts";

export const tradeLinksSchema = z
  .object({
    ...tradeTagsSchema.shape,
    ...tradeEvidenceShape,
    reviewNotes: z.string().trim().max(4000).optional(),
    prices: tradePricesSchema.optional(),
    breakeven: z.boolean().optional(),
    timeframe: z.string().trim().min(1).max(24).optional(),
    planId: z.uuid().optional(),
    playbook: playbookLinkSchema.optional(),
  })
  .refine(validMistakeReview, {
    path: ["criticalMistakes"],
    message: "Critical mistakes must be recorded on the trade.",
  });

export const tradeLinkCommand = z.object({
  id: z.uuid(),
  previous: tradeLinksSchema,
  next: tradeLinksSchema,
});
