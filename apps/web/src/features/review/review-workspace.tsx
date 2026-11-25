import { useMemo, useState } from "react";
import { REVIEW_INSIGHT_LIMIT } from "@liquidation/domain/review/constants";
import { reviewEvidence } from "@liquidation/domain/review/evidence";
import { simulateReview } from "@liquidation/domain/review/simulation";
import type { ReviewRule } from "@liquidation/domain/review/types";
import { useLocale } from "../../shared/messages.ts";
import { Panel } from "../../shared/ui/layout.tsx";
import { useStatisticsMessages } from "../statistics/messages.ts";
import { useReviewMessages } from "./messages.ts";
import { useReviewModel } from "./model/use-review-model.ts";
import { downloadReview } from "./report/markdown.ts";
import { ReviewOverview } from "./report/overview.tsx";
import {
  comparisonTable,
  findingText,
  reportTables,
} from "./report/presentation.ts";
import { reviewRuleLabel } from "./simulator/rule-label.ts";
import { ReviewSimulator } from "./simulator/simulator.tsx";
import { reviewSuggestions } from "./simulator/suggestions.ts";
import type { ReviewWorkspaceProps } from "./types.ts";

export function ReviewWorkspace({ report }: ReviewWorkspaceProps) {
  const locale = useLocale();
  const m = useReviewMessages();
  const { durations } = useStatisticsMessages();
  const presentation = { ...locale, messages: m };
  const [rule, setRule] = useState<ReviewRule | null>(null);
  const model = useReviewModel(report);
  const simulation = useMemo(
    () => (rule ? simulateReview(report, rule) : null),
    [report, rule],
  );
  const tables = reportTables(report, presentation, durations);
  const questions = reviewSuggestions(report, m);
  const evidence = useMemo(() => reviewEvidence(report), [report]);
  const hypotheses = new Map(
    model.insights.map(({ evidenceId, hypothesis }) => [
      evidenceId,
      hypothesis,
    ]),
  );
  const selected = hypotheses.size
    ? evidence.filter(({ id }) => hypotheses.has(id))
    : evidence.slice(0, REVIEW_INSIGHT_LIMIT);
  const findings = selected.map((fact) => ({
    ...findingText(fact, presentation, durations),
    hypothesis: hypotheses.get(fact.id),
    id: fact.id,
  }));

  function download() {
    downloadReview(
      {
        report,
        tables,
        findings,
        questions,
        comparison:
          rule && simulation
            ? {
                table: comparisonTable(simulation, presentation),
                label: reviewRuleLabel(rule, m),
              }
            : undefined,
      },
      presentation,
      simulation,
    );
  }

  return (
    <>
      <Panel
        title={m.observations}
        detail={
          <button type="button" className="secondary" onClick={download}>
            {m.download}
          </button>
        }
      >
        <div className="review-model">
          <div>
            <h3>{m.modelTitle}</h3>
            <p className="review-note">{m.modelDescription}</p>
          </div>
          <button
            type="button"
            className="secondary"
            disabled={model.running}
            onClick={() => void model.generate()}
          >
            {model.running ? m.modelRunning : m.modelAction}
          </button>
        </div>
        {model.error && <p role="status">{m.modelStatuses[model.error]}</p>}
        {model.stale && <p role="status">{m.stale}</p>}
        <ul className="review-findings">
          {findings.map(({ id, title, summary, hypothesis }) => (
            <li key={id}>
              <strong>{title}</strong>
              <small>{summary}</small>
              {hypothesis && <p lang="uk">{hypothesis}</p>}
            </li>
          ))}
        </ul>
      </Panel>
      <ReviewOverview report={report} tables={tables} />
      <ReviewSimulator
        report={report}
        suggestions={questions}
        rule={rule}
        onRule={setRule}
        result={simulation}
      />
    </>
  );
}
