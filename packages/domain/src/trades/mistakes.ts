import { tradeTagKey } from "./trade-tags.ts";
import type { MistakeReview } from "./types.ts";

export function mistakeKeys(record: Pick<MistakeReview, "mistakes">) {
  return [...new Set((record.mistakes ?? []).map(tradeTagKey))];
}

export function reviewedMistakes(
  record: Pick<MistakeReview, "mistakes" | "mistakesReviewed">,
) {
  return Boolean(record.mistakesReviewed || record.mistakes?.length);
}

export function validMistakeReview(
  record: Pick<MistakeReview, "mistakes" | "criticalMistakes">,
) {
  const tags = new Set(mistakeKeys(record));
  return (record.criticalMistakes ?? []).every((tag) =>
    tags.has(tradeTagKey(tag)),
  );
}
