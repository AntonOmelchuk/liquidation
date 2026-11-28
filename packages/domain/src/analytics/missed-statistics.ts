import { isBreakevenReviewReason } from "../workspace/planning.ts";
import type { MissedTrade } from "../workspace/types.ts";
import { estimatedMissedCents } from "./plan-performance.ts";

function assessedTotals(
  records: readonly MissedTrade[],
  executed: ReadonlySet<string>,
) {
  let assessed = 0;
  let withCash = 0;
  let netR = 0;
  let cash = 0;
  for (const { outcome, planId } of records) {
    if (!outcome || (planId && executed.has(planId))) continue;
    assessed++;
    netR += outcome.netR;
    const cents = estimatedMissedCents(outcome);
    if (cents !== null) {
      withCash++;
      cash += cents;
    }
  }
  return {
    count: records.length,
    assessed,
    withCash,
    netR: assessed ? netR : null,
    cash: withCash ? cash : null,
  };
}

function groupMisses<Key extends "reason" | "symbol">(
  records: readonly MissedTrade[],
  field: Key,
  executed: ReadonlySet<string>,
) {
  const groups = Map.groupBy(records, (miss) => miss[field]);
  return [...groups]
    .map(([key, entries]) => ({
      key,
      ...assessedTotals(entries, executed),
    }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

export function missedStatistics(
  records: readonly MissedTrade[],
  executed: ReadonlySet<string>,
) {
  const opportunities = records.filter(
    ({ reason }) => !isBreakevenReviewReason(reason),
  );
  return {
    total: assessedTotals(opportunities, executed),
    reasons: groupMisses(opportunities, "reason", executed),
    instruments: groupMisses(opportunities, "symbol", executed),
  };
}
