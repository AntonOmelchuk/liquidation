import {
  INSIGHT_ACTION,
  INSIGHT_FACTORS,
} from "@liquidation/domain/analytics/constants";
import {
  simulateInsights,
  tradeInsights,
} from "@liquidation/domain/analytics/trade-insights";
import type {
  TradeFactor,
  TradeInsight,
} from "@liquidation/domain/analytics/types";
import { useEffect, useMemo, useRef, useState } from "react";
import { PAGE_HASHES } from "../../../app/constants.ts";
import { FILTER_ALL, EMPTY_VALUE } from "../../../shared/constants.ts";
import { numericTone } from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import { CheckboxField } from "../../../shared/ui/checkbox-field.tsx";
import { Panel } from "../../../shared/ui/layout.tsx";
import { SelectField } from "../../../shared/ui/select-field.tsx";
import { TradeTable } from "../../journal/records/trade-table.tsx";
import { ComparisonTable } from "../../workspace/reports/comparison-table.tsx";
import { useStatisticsMessages } from "../messages.ts";
import { InsightTable } from "./insight-table.tsx";
import { useInsightMessages } from "./messages.ts";
import type { InsightReportProps, InsightScenario } from "./types.ts";

export function InsightReport({ trades, labelFor }: InsightReportProps) {
  const { t, format } = useLocale();
  const s = useStatisticsMessages();
  const m = useInsightMessages();
  const [factor, setFactor] = useState<TradeFactor>();
  const [onlySufficient, setOnlySufficient] = useState(false);
  const [scenario, setScenario] = useState<InsightScenario>();
  const insights = useMemo(() => tradeInsights(trades), [trades]);
  const comparable = insights.filter(
    (row) => row.sufficient && row.metrics.count < trades.length,
  );
  const strongest = comparable
    .filter((row) => row.metrics.net > 0)
    .toSorted(
      (a, b) => (b.metrics.expectancy ?? 0) - (a.metrics.expectancy ?? 0),
    )[0];
  const weakest = comparable
    .filter((row) => row.metrics.net < 0)
    .toSorted(
      (a, b) => (a.metrics.expectancy ?? 0) - (b.metrics.expectancy ?? 0),
    )[0];
  const matching = insights.filter(
    (row) =>
      (factor === undefined || row.factor === factor) &&
      (!onlySufficient || row.sufficient),
  );
  const activeRules = scenario?.rules ?? [];
  const scenarioPanel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scenario) {
      scenarioPanel.current?.scrollIntoView({ block: "start" });
      scenarioPanel.current?.focus({ preventScroll: true });
    }
  }, [scenario]);
  const result =
    scenario && activeRules.length
      ? simulateInsights(trades, activeRules, scenario.action)
      : undefined;

  function finding(title: string, row: TradeInsight | undefined) {
    return (
      <article className="insight-finding">
        <h3>{title}</h3>
        {row ? (
          <>
            <strong>
              {s[row.factor]} · {labelFor(row.factor, row.key)}
            </strong>
            <span className={numericTone(row.metrics.net)}>
              {format.money.format(row.metrics.net)} · {s.expectancy}{" "}
              {row.metrics.expectancy === null
                ? EMPTY_VALUE
                : format.money.format(row.metrics.expectancy)}
            </span>
            <small>
              {row.metrics.count} · {s.tradeCount} · WR{" "}
              {row.metrics.winRate === null
                ? EMPTY_VALUE
                : format.percentage.format(row.metrics.winRate)}
            </small>
          </>
        ) : (
          <p>{m.lackSample}</p>
        )}
      </article>
    );
  }
  return (
    <div className="layout insight-report">
      <Panel
        title={m.title}
        detail={
          <a className="action-link secondary" href={PAGE_HASHES.review}>
            {m.ai}
          </a>
        }
      >
        <p className="analytics-hint">{m.subtitle}</p>
        <div className="insight-findings">
          {finding(m.strongest, strongest)}
          {finding(m.weakest, weakest)}
        </div>
        <div className="insight-toolbar">
          <SelectField
            label={m.factor}
            value={factor ?? FILTER_ALL}
            onChange={(event) => {
              setFactor(
                INSIGHT_FACTORS.find(
                  (value) => value === event.currentTarget.value,
                ),
              );
              setScenario(undefined);
            }}
          >
            <option value={FILTER_ALL}>{m.all}</option>
            {INSIGHT_FACTORS.map((key) => (
              <option key={key} value={key}>
                {s[key]}
              </option>
            ))}
          </SelectField>
          <CheckboxField
            checked={onlySufficient}
            onChange={(event) => setOnlySufficient(event.currentTarget.checked)}
          >
            {m.onlySufficient}
          </CheckboxField>
        </div>
        <p className="analytics-hint">{m.minHint}</p>
      </Panel>
      <InsightTable
        rows={matching.filter((row) => row.metrics.net > 0)}
        action={INSIGHT_ACTION.INCLUDE}
        labelFor={labelFor}
        onSimulate={setScenario}
      />
      <InsightTable
        rows={matching.filter((row) => row.metrics.net < 0)}
        action={INSIGHT_ACTION.EXCLUDE}
        labelFor={labelFor}
        onSimulate={setScenario}
      />
      {result && scenario && (
        <div ref={scenarioPanel} tabIndex={-1}>
          <Panel
            title={m.scenario}
            detail={
              <button
                type="button"
                className="secondary"
                onClick={() => setScenario(undefined)}
              >
                {t.close}
              </button>
            }
          >
            <p>
              {scenario.action === INSIGHT_ACTION.INCLUDE
                ? m.ruleKeep
                : m.ruleRemove}
            </p>
            <ul className="insight-rule-list">
              {activeRules.map(({ factor, key }) => (
                <li key={JSON.stringify([factor, key])}>
                  {s[factor]} · {labelFor(factor, key)}
                </li>
              ))}
            </ul>
            <ComparisonTable
              current={result.kept}
              previous={trades}
              currentLabel={m.simulated}
              previousLabel={m.actual}
              showChange
            />
            <p>
              {s.maxLoss} · {result.actual.longestLoss} →{" "}
              {result.scenario.longestLoss}
            </p>
            <details className="analytics-more">
              <summary>
                {m.removed} · {result.excluded.length}
              </summary>
              <TradeTable trades={result.excluded} />
            </details>
            <details className="analytics-more">
              <summary>
                {m.kept} · {result.kept.length}
              </summary>
              <TradeTable trades={result.kept} />
            </details>
            <p className="analytics-hint">{m.limitation}</p>
          </Panel>
        </div>
      )}
    </div>
  );
}
