import { tradeCurves } from "@liquidation/domain/analytics/trade-risk";
import { PAGE_VIEW } from "../../../app/constants.ts";
import type { PlanLinkedTradesProps } from "./types.ts";

import { planHref } from "../../../app/page.ts";
import { SeriesChart } from "../../../shared/analytics/series-chart.tsx";
import { EMPTY_VALUE } from "../../../shared/constants.ts";
import { numericTone } from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import { DirectionBadge } from "../../../shared/ui/direction-badge.tsx";
import { Panel } from "../../../shared/ui/layout.tsx";
import { MetricCard, MetricGrid } from "../../../shared/ui/metric-card.tsx";
import { METRIC_TONE } from "../../../shared/ui/metric-constants.ts";
import { metricParts } from "../../../shared/ui/metric-parts.ts";
import {
  MetricGauge,
  MetricLegend,
} from "../../../shared/ui/metric-visuals.tsx";
import { TradeTable } from "../../journal/records/trade-table.tsx";
import { TRADE_TABLE_MODE } from "../../journal/records/constants.ts";
import { usePlanMessages } from "../messages.ts";

export function PlanLinkedTrades({
  planId,
  data,
  trades,
  positions,
}: PlanLinkedTradesProps) {
  const { format } = useLocale();
  const p = usePlanMessages();
  const { actual, narrative, alignment } = data;
  const number = (value: number) => format.integer.format(value);
  const r = (value: number | null) =>
    value === null ? EMPTY_VALUE : `${format.money.format(value)} R`;
  const records = [...trades, ...positions];
  const { cash, multiples } = tradeCurves(trades);
  const outcomes = metricParts(format.integer, [
    [METRIC_TONE.POSITIVE, p.wins, actual.wins],
    [METRIC_TONE.NEUTRAL, p.flat, actual.flat],
    [METRIC_TONE.NEGATIVE, p.losses, actual.losses],
  ]);

  return (
    <Panel
      title={p.executionStats}
      detail={
        <a
          className="action-link secondary"
          href={planHref(planId, PAGE_VIEW.TRADES)}
        >
          {p.manageTrades}
        </a>
      }
    >
      <MetricGrid compact>
        <MetricCard
          label={p.tradeWinRate}
          value={
            actual.winRate === null
              ? EMPTY_VALUE
              : format.percentage.format(actual.winRate)
          }
          icon="TARGET"
          detail={actual.closed > 0 && <MetricLegend parts={outcomes} />}
        >
          <MetricGauge parts={outcomes} semicircle />
        </MetricCard>
        <MetricCard
          label={p.realizedPnl}
          value={actual.closed ? format.money.format(actual.net) : EMPTY_VALUE}
          tone={numericTone(actual.net)}
          icon="WALLET"
          detail={`${p.closedTrades} ${number(actual.closed)} · ${p.openTrades} ${number(actual.open)}`}
        >
          <SeriesChart
            compact
            signed
            label={p.realizedPnl}
            values={cash.length ? [0, ...cash.map(({ value }) => value)] : []}
          />
        </MetricCard>
        <MetricCard
          label={p.totalR}
          value={r(actual.totalR)}
          tone={numericTone(actual.totalR ?? 0) ?? METRIC_TONE.NEUTRAL}
          icon="TREND"
          detail={
            actual.missingRisk
              ? `${p.riskMissing} · ${number(actual.missingRisk)}`
              : undefined
          }
        >
          <SeriesChart
            compact
            signed
            label={p.totalR}
            values={
              multiples.length
                ? [0, ...multiples.map(({ value }) => value)]
                : []
            }
            unit=" R"
          />
        </MetricCard>
      </MetricGrid>

      {alignment && actual.count > 0 && (
        <div className="plan-alignment">
          <h3>{p.alignment}</h3>
          <p>
            {p.plannedBias} ·{" "}
            <DirectionBadge direction={narrative}>
              {p[narrative]}
            </DirectionBadge>
          </p>
          {(["withNarrative", "againstNarrative"] as const).map((key) => (
            <div className="plan-alignment-row" key={key}>
              <span>{p[key]}</span>
              <strong>
                {number(alignment[key].count)} · {r(alignment[key].totalR)}
              </strong>
            </div>
          ))}
        </div>
      )}
      {actual.count === 0 ? (
        <p>{p.noLinkedTrades}</p>
      ) : (
        <TradeTable
          trades={records}
          mode={TRADE_TABLE_MODE.MIXED}
          label={p.linked}
        />
      )}
    </Panel>
  );
}
