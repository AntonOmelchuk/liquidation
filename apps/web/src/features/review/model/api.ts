import {
  HTTP_METHOD,
  JOURNAL_ROUTES,
  MEDIA_TYPE,
} from "@liquidation/domain/journal/constants";
import { REVIEW_MODEL_STATUS } from "@liquidation/domain/review/constants";
import { reviewModelResultSchema } from "@liquidation/domain/review/schemas";
import type {
  ReviewModelResult,
  ReviewQuery,
} from "@liquidation/domain/review/types";

export async function requestReview(
  query: ReviewQuery,
  signal: AbortSignal,
): Promise<ReviewModelResult> {
  try {
    const response = await fetch(JOURNAL_ROUTES.aiReview, {
      method: HTTP_METHOD.POST,
      signal,
      headers: { "Content-Type": MEDIA_TYPE.JSON },
      body: JSON.stringify(query),
    });
    if (!response.ok) return { status: REVIEW_MODEL_STATUS.UNAVAILABLE };
    const result = reviewModelResultSchema.safeParse(await response.json());
    return result.success
      ? result.data
      : { status: REVIEW_MODEL_STATUS.INVALID };
  } catch {
    return { status: REVIEW_MODEL_STATUS.UNAVAILABLE };
  }
}
