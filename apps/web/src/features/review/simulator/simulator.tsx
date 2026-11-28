import { DateText } from "../../../shared/ui/date-text.tsx";
import { useId } from "react";
import {
  REVIEW_EXCLUSION_LIMIT,
  REVIEW_GROUP,
  REVIEW_RULE,
} from "@liquidation/domain/review/constants";
import { netCents } from "@liquidation/domain/trades/trade";
import { useLocale } from "../../../shared/messages.ts";
import { Panel } from "../../../shared/ui/layout.tsx";
import { useReviewMessages } from "../messages.ts";
import { ReviewDataTable } from "../report/data-table.tsx";
import { comparisonTable, reviewValues } from "../report/presentation.ts";
import type { ReviewSimulatorProps } from "../types.ts";
import { RuleForm } from "./rule-form.tsx";
import { reviewRuleLabel } from "./rule-label.ts";

export function ReviewSimulator({
  report,
  suggestions,
  rule,
  onRule,
  result,
}: ReviewSimulatorProps) {
  const locale = useLocale();
  const m = useReviewMessages();
  const { t } = locale;
  const id = useId();
  const presentation = { ...locale, messages: m };
  const { amount, count } = reviewValues(presentation);

  return (
    <Panel title={m.explore}>
      <h3>{m.followUps}</h3>
      <div className="review-suggestions">
        {suggestions.map(({ key, label, rule: suggestion }) => (
          <button
            key={key}
            type="button"
            className="secondary"
            aria-controls={id}
            onClick={() => onRule(suggestion)}
          >
            {label}
          </button>
        ))}
      </div>
      <RuleForm
        symbols={report.groups[REVIEW_GROUP.SYMBOLS].map(({ key }) => key)}
        onApply={onRule}
      />
      <div id={id} aria-live="polite">
        {rule && result && (
          <section className="review-scenario">
            <h3>{reviewRuleLabel(rule, m)}</h3>
            <ReviewDataTable {...comparisonTable(result, presentation)} />
            {rule.kind === REVIEW_RULE.DAILY_LOSS && (
              <p className="review-note">{m.dailyScope}</p>
            )}
            {rule.kind === REVIEW_RULE.LOSING_STREAK && (
              <p className="review-note">{m.streakScope}</p>
            )}
            <h4>
              {m.excluded} · {count(result.excluded.length)}
            </h4>
            {result.excluded.length === 0 ? (
              <p>{m.noneExcluded}</p>
            ) : result.excluded.length <= REVIEW_EXCLUSION_LIMIT ? (
              <ul className="review-exclusions">
                {result.excluded.map((trade) => (
                  <li key={trade.id}>
                    {trade.symbol} · {t[trade.direction]} ·{" "}
                    <DateText value={trade.openedAt} withTime />
                    {" · "}
                    {amount(netCents(trade) / 100)}
                  </li>
                ))}
              </ul>
            ) : (
              <p>{m.manyExcluded}</p>
            )}
            <p className="review-note">{m.hindsight}</p>
          </section>
        )}
      </div>
    </Panel>
  );
}
