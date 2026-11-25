import { z } from "zod";
import { isReviewTimeZone } from "./calendar.ts";
import {
  ENTRY_HOUR_SIDE,
  REVIEW_INSIGHT_LIMIT,
  REVIEW_MODEL_STATUS,
  REVIEW_RULE,
} from "./constants.ts";

export const reviewQuerySchema = z
  .strictObject({
    from: z.iso.date(),
    through: z.iso.date(),
    account: z.string().max(160).optional(),
    timeZone: z.string().min(1).max(64).refine(isReviewTimeZone),
  })
  .refine(({ from, through }) => from <= through);

export const entryHourSchema = z.number().int().min(0).max(23);
export const reviewRuleSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal(REVIEW_RULE.SYMBOLS),
    symbols: z.array(z.string()).min(1).max(2),
  }),
  z.object({
    kind: z.literal(REVIEW_RULE.ENTRY_HOUR),
    hour: entryHourSchema,
    side: z.enum(ENTRY_HOUR_SIDE),
  }),
  z.object({
    kind: z.literal(REVIEW_RULE.MINIMUM_HOLD),
    hours: z.number().min(1).max(72),
  }),
  z.object({ kind: z.literal(REVIEW_RULE.DAILY_LOSS) }),
  z.object({ kind: z.literal(REVIEW_RULE.LOSING_STREAK) }),
]);

export const reviewInsightsSchema = z.object({
  insights: z
    .array(
      z.strictObject({
        evidenceId: z.string().regex(/^F\d{1,2}$/),
        hypothesis: z
          .string()
          .trim()
          .min(12)
          .max(280)
          .refine((value) => !/\p{N}/u.test(value)),
      }),
    )
    .min(1)
    .max(REVIEW_INSIGHT_LIMIT),
});

export const reviewModelResultSchema = z.discriminatedUnion("status", [
  reviewInsightsSchema.extend({
    status: z.literal(REVIEW_MODEL_STATUS.READY),
    signature: z.string().max(16000),
  }),
  z.object({
    status: z.enum([
      REVIEW_MODEL_STATUS.DISABLED,
      REVIEW_MODEL_STATUS.EMPTY,
      REVIEW_MODEL_STATUS.UNAVAILABLE,
      REVIEW_MODEL_STATUS.BUSY,
      REVIEW_MODEL_STATUS.INVALID,
    ]),
  }),
]);
