import { z } from "zod";
import { ENTRY_TYPE, TRADE_SESSION, TRADE_TAG_LIMITS } from "./constants.ts";

export function tradeTagKey(label: string) {
  return label.trim().toLowerCase();
}

export const tradeTagsSchema = z.object({
  account: z.string().trim().min(1).max(TRADE_TAG_LIMITS.account).optional(),
  session: z.enum(TRADE_SESSION).optional(),
  entryType: z.enum(ENTRY_TYPE).optional(),
  mistakes: z
    .array(z.string().trim().min(1).max(TRADE_TAG_LIMITS.mistake))
    .max(TRADE_TAG_LIMITS.mistakes)
    .transform((labels) => {
      const unique = new Map<string, string>();
      for (const label of labels) {
        const key = tradeTagKey(label);
        if (!unique.has(key)) unique.set(key, label);
      }
      return [...unique.values()];
    })
    .optional(),
});
