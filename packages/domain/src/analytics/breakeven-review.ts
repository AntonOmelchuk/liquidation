import { BREAKEVEN_REVIEW_REASONS } from "../workspace/constants.ts";
import { isBreakevenReviewReason } from "../workspace/planning.ts";
import type { MissedTrade } from "../workspace/types.ts";
import { estimatedMissedCents } from "./plan-performance.ts";

function aggregateBreakevenEffects(records: readonly MissedTrade[]) {
  let assessed = 0;
  let measuredCash = 0;
  let effectR = 0;
  let effectCents = 0;
  for (const { outcome } of records) {
    if (!outcome) continue;
    assessed++;
    // The stored delta is the extra result without BE, so invert it for the effect of using BE.
    effectR -= outcome.netR;
    const cents = estimatedMissedCents(outcome);
    if (cents !== null) {
      measuredCash++;
      effectCents -= cents;
    }
  }
  return {
    count: records.length,
    assessed,
    measuredCash,
    effectR: assessed ? effectR : null,
    effectCents: measuredCash ? effectCents : null,
  };
}

export function summarizeBreakevenReviews(records: readonly MissedTrade[]) {
  const reviews = records.filter(({ reason }) =>
    isBreakevenReviewReason(reason),
  );
  const byReason = Map.groupBy(reviews, ({ reason }) => reason);
  return {
    rows: BREAKEVEN_REVIEW_REASONS.map((reason) => ({
      reason,
      ...aggregateBreakevenEffects(byReason.get(reason) ?? []),
    })),
    total: aggregateBreakevenEffects(reviews),
  };
}
