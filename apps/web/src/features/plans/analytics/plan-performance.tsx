import { SCENARIO_UNIT } from "@liquidation/domain/analytics/constants";
import { PLAN_CHART } from "./constants.ts";
import type { OutcomeChartProps, PlanPerformancePanelProps } from "./types.ts";

import { useLocale } from "../../../shared/messages.ts";
import { Panel } from "../../../shared/ui/layout.tsx";
import { usePlanMessages } from "../messages.ts";

function OutcomeChart({ points, unit }: OutcomeChartProps) {
  const { format } = useLocale();
  const p = usePlanMessages();
  if (!points.length)
    return (
      <div className="chart-empty">
        <p>
          {unit === SCENARIO_UNIT.R ? p.comparisonEmpty : p.cashComparisonEmpty}
        </p>
      </div>
    );

  let low = 0;
  let high = 0;
  for (const { realized, scenario } of points) {
    low = Math.min(low, realized, scenario);
    high = Math.max(high, realized, scenario);
  }
  if (low === high) {
    low = -1;
    high = 1;
  }

  const first = points[0].timestamp;
  const last = points[points.length - 1].timestamp;
  const y = (value: number) =>
    PLAN_CHART.padding +
    ((high - value) / (high - low)) *
      (PLAN_CHART.height - 2 * PLAN_CHART.padding);
  const stepPath = (series: "realized" | "scenario") => {
    const steps = points.map((point) => {
      const x =
        last === first
          ? PLAN_CHART.width / 2
          : ((point.timestamp - first) / (last - first)) * PLAN_CHART.width;
      return `H${x} V${y(point[series])}`;
    });
    return `M0,${y(0)} ${steps.join(" ")} H${PLAN_CHART.width}`;
  };

  return (
    <figure className="plan-outcome-figure">
      <div className="chart plan-outcome-chart">
        <div className="chart-scale" aria-hidden="true">
          <span>
            {format.money.format(high)}
            {unit === SCENARIO_UNIT.R ? " R" : ""}
          </span>
          <span>
            {format.money.format(low)}
            {unit === SCENARIO_UNIT.R ? " R" : ""}
          </span>
        </div>
        <svg
          role="img"
          aria-label={`${p.comparison} · ${unit === SCENARIO_UNIT.R ? p.unitR : p.unitCash}`}
          viewBox={`0 0 ${PLAN_CHART.width} ${PLAN_CHART.height}`}
          preserveAspectRatio="none"
        >
          <line
            x1="0"
            x2={PLAN_CHART.width}
            y1={y(0)}
            y2={y(0)}
            className="baseline"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={stepPath("realized")}
            className="plan-curve-realized"
            fill="none"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={stepPath("scenario")}
            className="plan-curve-scenario"
            fill="none"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      <figcaption>
        <time dateTime={new Date(first).toISOString()}>
          {format.date.format(first)}
        </time>
        {last !== first && (
          <time dateTime={new Date(last).toISOString()}>
            {format.date.format(last)}
          </time>
        )}
      </figcaption>
    </figure>
  );
}

export function PlanPerformancePanel({
  data,
  unit = SCENARIO_UNIT.R,
}: PlanPerformancePanelProps) {
  const { format } = useLocale();
  const p = usePlanMessages();
  const series = unit === SCENARIO_UNIT.R ? data : data.cash;
  const missing =
    unit === SCENARIO_UNIT.R ? data.tradesWithoutRisk : data.missesWithoutRisk;
  const multiple = (value: number) =>
    `${format.money.format(value)}${unit === SCENARIO_UNIT.R ? " R" : ""}`;

  return (
    <Panel
      title={p.comparison}
      detail={unit === SCENARIO_UNIT.R ? p.unitR : p.unitCash}
    >
      {series.points.length > 0 && (
        <dl className="comparison-legend">
          <div data-series="realized">
            <dt>{p.realized}</dt>
            <dd>{multiple(series.realized)}</dd>
          </div>
          <div data-series="scenario">
            <dt>{p.scenario}</dt>
            <dd>{multiple(series.scenario)}</dd>
          </div>
          <div>
            <dt>{p.difference}</dt>
            <dd>{multiple(series.missed)}</dd>
          </div>
        </dl>
      )}
      <OutcomeChart points={series.points} unit={unit} />
      {series.points.length > 0 && (
        <p className="plan-field-hint">
          {unit === SCENARIO_UNIT.R ? p.rComparisonHint : p.cashComparisonHint}
        </p>
      )}
      {(missing > 0 ||
        data.linkedMisses > 0 ||
        data.replacedPlanMisses > 0 ||
        data.recordedMisses > 0) && (
        <ul className="comparison-exclusions">
          {missing > 0 && (
            <li>
              {unit === SCENARIO_UNIT.R ? p.missingRisk : p.cashMissingRisk} ·{" "}
              {format.integer.format(missing)}
            </li>
          )}
          {data.linkedMisses > 0 && (
            <li>
              {p.excludedLinked} · {format.integer.format(data.linkedMisses)}
            </li>
          )}
          {data.recordedMisses > 0 && (
            <li>
              {p.recordedMisses} · {format.integer.format(data.recordedMisses)}
            </li>
          )}
          {data.replacedPlanMisses > 0 && (
            <li>
              {p.replacedPlanMisses} ·{" "}
              {format.integer.format(data.replacedPlanMisses)}
            </li>
          )}
        </ul>
      )}
    </Panel>
  );
}
