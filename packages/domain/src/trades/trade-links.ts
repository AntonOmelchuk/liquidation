import { z } from "zod";
import { playbookLinkSchema } from "../playbooks/playbook.ts";
import { tradeTagsSchema } from "./trade-tags.ts";

export const tradeLinksSchema = z.object({
  ...tradeTagsSchema.shape,
  timeframe: z.string().trim().min(1).max(24).optional(),
  planId: z.uuid().optional(),
  playbook: playbookLinkSchema.optional(),
});

export const tradeLinkCommand = z.object({
  id: z.uuid(),
  previous: tradeLinksSchema,
  next: tradeLinksSchema,
});
