import { REVIEW_RULE } from "@liquidation/domain/review/constants";
import type { ReviewRule } from "@liquidation/domain/review/types";
import type { ReviewMessages } from "../types.ts";

export function reviewRuleLabel(rule: ReviewRule, m: ReviewMessages) {
  switch (rule.kind) {
    case REVIEW_RULE.SYMBOLS:
      return `${m.rules[rule.kind]} · ${rule.symbols.join(" / ")}`;
    case REVIEW_RULE.ENTRY_HOUR:
      return `${m.hourSides[rule.side]} ${String(rule.hour).padStart(2, "0")}:00`;
    case REVIEW_RULE.MINIMUM_HOLD:
      return `${m.minimumHours} · ${rule.hours}`;
    default:
      return m.rules[rule.kind];
  }
}
