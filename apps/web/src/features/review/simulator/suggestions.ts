import {
  ENTRY_HOUR_SIDE,
  REVIEW_GROUP,
  REVIEW_RULE,
} from "@liquidation/domain/review/constants";
import type { ReviewReport } from "@liquidation/domain/review/types";
import type { ReviewMessages, ReviewSuggestion } from "../types.ts";

export function reviewSuggestions(
  report: ReviewReport,
  m: ReviewMessages,
): ReviewSuggestion[] {
  const symbols = report.groups[REVIEW_GROUP.SYMBOLS]
    .slice(0, 2)
    .map(({ key }) => key);
  const bestHour = report.groups[REVIEW_GROUP.HOURS].toSorted(
    (a, b) => b.metrics.net - a.metrics.net,
  )[0];
  const hour = Number(bestHour?.key ?? 16);
  const label = `${String(hour).padStart(2, "0")}:00`;
  return [
    {
      key: REVIEW_RULE.SYMBOLS,
      label: `${m.onlySymbols} ${symbols.join(" / ")}?`,
      rule: { kind: REVIEW_RULE.SYMBOLS, symbols },
    },
    {
      key: ENTRY_HOUR_SIDE.BEFORE,
      label: `${m.entryBefore} ${label}?`,
      rule: {
        kind: REVIEW_RULE.ENTRY_HOUR,
        hour,
        side: ENTRY_HOUR_SIDE.BEFORE,
      },
    },
    {
      key: ENTRY_HOUR_SIDE.AFTER,
      label: `${m.entryAfter} ${label}?`,
      rule: { kind: REVIEW_RULE.ENTRY_HOUR, hour, side: ENTRY_HOUR_SIDE.AFTER },
    },
    {
      key: REVIEW_RULE.MINIMUM_HOLD,
      label: m.fewerHours,
      rule: { kind: REVIEW_RULE.MINIMUM_HOLD, hours: 4 },
    },
    {
      key: REVIEW_RULE.DAILY_LOSS,
      label: m.dailyQuestion,
      rule: { kind: REVIEW_RULE.DAILY_LOSS },
    },
    {
      key: REVIEW_RULE.LOSING_STREAK,
      label: m.streakQuestion,
      rule: { kind: REVIEW_RULE.LOSING_STREAK },
    },
  ];
}
