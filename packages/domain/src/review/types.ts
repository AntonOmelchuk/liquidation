import type { z } from "zod";
import type { Journal } from "../journal/types.ts";
import type { Trade } from "../trades/types.ts";
import type { createReviewCalendar } from "./calendar.ts";
import type {
  entryHourSchema,
  reviewModelResultSchema,
  reviewQuerySchema,
  reviewRuleSchema,
} from "./schemas.ts";
import type {
  ENTRY_HOUR_SIDE,
  REVIEW_GROUP,
  REVIEW_PERIOD,
} from "./constants.ts";
import type { buildReview, reviewMetrics } from "./report.ts";
import type { reviewEvidence } from "./evidence.ts";
import type { simulateReview } from "./simulation.ts";

export type ReviewPeriod = (typeof REVIEW_PERIOD)[keyof typeof REVIEW_PERIOD];
export type ReviewGroup = (typeof REVIEW_GROUP)[keyof typeof REVIEW_GROUP];
export type ReviewQuery = z.infer<typeof reviewQuerySchema>;
export type ReviewCalendar = ReturnType<typeof createReviewCalendar>;
export type ReviewRule = z.infer<typeof reviewRuleSchema>;
export type ReviewEntryHour = z.infer<typeof entryHourSchema>;
export type EntryHourSide =
  (typeof ENTRY_HOUR_SIDE)[keyof typeof ENTRY_HOUR_SIDE];

export type ReviewSource = Pick<Journal, "trades" | "positions">;
export type ReviewMetrics = ReturnType<typeof reviewMetrics>;
export type ReviewBucket = {
  key: string;
  title: string;
  side?: Trade["direction"];
  metrics: ReviewMetrics;
};
export type ReviewReport = ReturnType<typeof buildReview>;
export type ReviewSimulation = ReturnType<typeof simulateReview>;
export type ReviewEvidence = ReturnType<typeof reviewEvidence>[number];
export type ReviewModelResult = z.infer<typeof reviewModelResultSchema>;
export type ReviewModelPayload = Extract<
  ReviewModelResult,
  { insights: unknown }
>;
