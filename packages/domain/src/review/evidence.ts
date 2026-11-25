import { REVIEW_GROUP, REVIEW_SMALL_SAMPLE } from "./constants.ts";
import type { ReviewBucket, ReviewGroup, ReviewReport } from "./types.ts";

function extreme(rows: readonly ReviewBucket[], gain: boolean) {
  const matching = rows.filter(({ metrics }) =>
    gain ? metrics.net > 0 : metrics.net < 0,
  );
  return matching.sort((a, b) =>
    gain ? b.metrics.net - a.metrics.net : a.metrics.net - b.metrics.net,
  )[0];
}

export function reviewEvidence(report: ReviewReport) {
  const factors = [
    REVIEW_GROUP.SYMBOLS,
    REVIEW_GROUP.WEEKDAYS,
    REVIEW_GROUP.SIDES,
    REVIEW_GROUP.HOURS,
    REVIEW_GROUP.DURATIONS,
    REVIEW_GROUP.MONTHS,
  ] as const;
  const evidence: { id: string; group: ReviewGroup; bucket: ReviewBucket }[] =
    [];
  for (const group of factors) {
    const rows = report.groups[group];
    const best = extreme(rows, true);
    const worst = extreme(rows, false);
    for (const bucket of [best, worst]) {
      if (bucket)
        evidence.push({ id: `F${evidence.length + 1}`, group, bucket });
    }
  }
  if (!evidence.length && report.groups[REVIEW_GROUP.SYMBOLS].length) {
    evidence.push({
      id: "F1",
      group: REVIEW_GROUP.SYMBOLS,
      bucket: report.groups[REVIEW_GROUP.SYMBOLS][0],
    });
  }
  return evidence;
}

// Only code-generated group IDs and aggregate metrics cross the model boundary.
export function modelEvidence(report: ReviewReport) {
  return reviewEvidence(report).map(({ id, group, bucket: { metrics } }) => ({
    id,
    group,
    count: metrics.count,
    winRate: metrics.winRate,
    net: metrics.net,
    expectancy: metrics.expectancy,
    totalR: metrics.totalR,
    riskCount: metrics.countWithRisk,
    small: metrics.count < REVIEW_SMALL_SAMPLE,
  }));
}

export function reviewEvidenceSignature(report: ReviewReport) {
  return JSON.stringify({
    query: [
      report.query.from,
      report.query.through,
      report.query.timeZone,
      report.query.account,
    ],
    groups: reviewEvidence(report).map(({ id, group, bucket: { key } }) => [
      id,
      group,
      key,
    ]),
    facts: modelEvidence(report),
  });
}
