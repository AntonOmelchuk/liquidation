import { z } from "zod";
import {
  ENTRY_TEST,
  ENTRY_TYPE,
  TRADE_SESSION,
  TRADE_TAG_LIMITS,
} from "./constants.ts";
import type { TradeLinks } from "./types.ts";

export function entryTestKey(value: boolean | undefined) {
  return value === undefined
    ? ""
    : value
      ? ENTRY_TEST.RETESTED
      : ENTRY_TEST.MARKET_ONLY;
}

export function tradeTagKey(label: string) {
  return label.trim().toLowerCase();
}

export function tradeAccountKey(
  record: Pick<TradeLinks, "account" | "accountId">,
) {
  return record.accountId ?? tradeTagKey(record.account ?? "");
}

const mistakeLabelsSchema = z
  .array(z.string().trim().min(1).max(TRADE_TAG_LIMITS.mistake))
  .max(TRADE_TAG_LIMITS.mistakes)
  .transform((labels) => {
    const unique = new Map<string, string>();
    for (const label of labels) {
      const key = tradeTagKey(label);
      if (!unique.has(key)) unique.set(key, label);
    }
    return [...unique.values()];
  });

export const tradeTagsSchema = z.object({
  account: z.string().trim().min(1).max(TRADE_TAG_LIMITS.account).optional(),
  accountId: z.uuid().optional(),
  style: z.string().trim().min(1).max(TRADE_TAG_LIMITS.style).optional(),
  session: z.enum(TRADE_SESSION).optional(),
  entryType: z.enum(ENTRY_TYPE).optional(),
  limitEntryTest: z.boolean().optional(),
  mistakes: mistakeLabelsSchema.optional(),
  criticalMistakes: mistakeLabelsSchema.optional(),
  mistakesReviewed: z.boolean().optional(),
});
