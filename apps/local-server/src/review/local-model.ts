import { z } from "zod";
import {
  REVIEW_INSIGHT_LIMIT,
  REVIEW_MODEL_STATUS,
} from "@liquidation/domain/review/constants";
import {
  modelEvidence,
  reviewEvidenceSignature,
} from "@liquidation/domain/review/evidence";
import { reviewInsightsSchema } from "@liquidation/domain/review/schemas";
import {
  REVIEW_MODEL_ENABLED,
  REVIEW_MODEL_MAX_TOKENS,
  REVIEW_MODEL_NAME,
  REVIEW_MODEL_TIMEOUT_MS,
  REVIEW_SYSTEM_PROMPT,
} from "./constants.ts";
import { localCompletion } from "./local-transport.ts";
import type { ReviewCompletionRequest, ReviewSummarizer } from "./types.ts";

const completionSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({ content: z.string().max(12_000) }),
      }),
    )
    .min(1),
});

export function createLocalReview(
  enabled = process.env.LIQUIDATION_AI_REVIEW === REVIEW_MODEL_ENABLED,
  complete: ReviewCompletionRequest = localCompletion(),
): ReviewSummarizer {
  let generating = false;
  return async (report, signal) => {
    if (!report.records.length) return { status: REVIEW_MODEL_STATUS.EMPTY };
    if (!enabled) return { status: REVIEW_MODEL_STATUS.DISABLED };
    if (generating) return { status: REVIEW_MODEL_STATUS.BUSY };

    const facts = modelEvidence(report);
    const allowed = new Set(facts.map(({ id }) => id));
    const limit = Math.min(allowed.size, REVIEW_INSIGHT_LIMIT);
    const timeout = AbortSignal.timeout(REVIEW_MODEL_TIMEOUT_MS);
    generating = true;
    try {
      const body = JSON.stringify({
        model: REVIEW_MODEL_NAME,
        stream: false,
        max_tokens: REVIEW_MODEL_MAX_TOKENS,
        temperature: 0.2,
        messages: [
          { role: "system", content: REVIEW_SYSTEM_PROMPT },
          {
            role: "user",
            content: JSON.stringify({ insightsRequested: limit, facts }),
          },
        ],
        response_format: {
          type: "json_object",
          schema: z.toJSONSchema(reviewInsightsSchema),
        },
      });
      const completed = await complete(
        body,
        signal ? AbortSignal.any([signal, timeout]) : timeout,
      );
      const completion = completionSchema.safeParse(completed);
      if (!completion.success) return { status: REVIEW_MODEL_STATUS.INVALID };

      let raw: unknown;
      try {
        raw = JSON.parse(completion.data.choices[0].message.content);
      } catch {
        return { status: REVIEW_MODEL_STATUS.INVALID };
      }
      const result = reviewInsightsSchema.safeParse(raw);
      if (!result.success) return { status: REVIEW_MODEL_STATUS.INVALID };
      const ids = result.data.insights.map(({ evidenceId }) => evidenceId);
      if (
        ids.length > limit ||
        new Set(ids).size !== ids.length ||
        !ids.every((id) => allowed.has(id))
      )
        return { status: REVIEW_MODEL_STATUS.INVALID };

      return {
        status: REVIEW_MODEL_STATUS.READY,
        signature: reviewEvidenceSignature(report),
        insights: result.data.insights,
      };
    } catch {
      return { status: REVIEW_MODEL_STATUS.UNAVAILABLE };
    } finally {
      generating = false;
    }
  };
}
