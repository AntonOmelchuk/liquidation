import type {
  ReviewModelResult,
  ReviewReport,
} from "@liquidation/domain/review/types";

export type ReviewSummarizer = (
  report: ReviewReport,
  signal?: AbortSignal,
) => Promise<ReviewModelResult>;

export type ReviewCompletionRequest = (
  body: string,
  signal: AbortSignal,
) => Promise<unknown>;
