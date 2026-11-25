import {
  GroupCheckbox,
  GroupCheckboxHeader,
  GroupSelectionSummary,
  useTradeGroupSelection,
} from "./group-selection.tsx";
import {
  riskDistribution,
  riskDrawdown,
  stopOverruns,
  tradeCurves,
} from "@liquidation/domain/analytics/trade-risk";
import { useState } from "react";
import type { RiskBucket } from "@liquidation/domain/analytics/types";
import { SeriesChart } from "../../shared/analytics/series-chart.tsx";
import { EMPTY_VALUE } from "../../shared/constants.ts";
import { useLocale } from "../../shared/messages.ts";
import { Panel } from "../../shared/ui/layout.tsx";
import { TradeTable } from "../journal/records/trade-table.tsx";
import { R_BUCKET_LABELS } from "./advanced-constants.ts";
import { useAdvancedStatisticsMessages } from "./advanced-messages.ts";
import type { TradeAnalysisProps } from "./types.ts";

export function RiskAnalysis({ trades }: TradeAnalysisProps) {
  const { t, format } = useLocale();
  const a = useAdvancedStatisticsMessages();
  const [selected, setSelected] = useState<RiskBucket>();
  const curves = tradeCurves(trades);
  const fall = riskDrawdown(curves.multiples);
  const distribution = riskDistribution(trades);
  const selection = useTradeGroupSelection(distribution);
  const measured = distribution.reduce((sum, row) => sum + row.count, 0);
  const overruns = stopOverruns(trades);
  const active = distribution.find((row) => row.key === selected);
  const money = (value: number) => format.money.format(value);
  return (
    <>
      <div className="analysis-chart-grid">
        <Panel title={a.cumulativeCash}>
          <SeriesChart
            values={
              curves.cash.length
                ? [0, ...curves.cash.map((point) => point.value)]
                : []
            }
            label={a.cumulativeCash}
            empty={t.noChart}
          />
        </Panel>
        <Panel title={a.cumulativeR} detail={a.measured + " · " + measured}>
          <SeriesChart
            values={
              curves.multiples.length
                ? [0, ...curves.multiples.map((point) => point.value)]
                : []
            }
            label={a.cumulativeR}
            empty={a.noRisk}
            unit=" R"
          />
          {measured > 0 && (
            <dl className="statistics-facts risk-facts">
              <div>
                <dt>{a.drawdownR}</dt>
                <dd>{money(fall.amount)} R</dd>
              </div>
              {fall.troughAt !== null && (
                <>
                  <div>
                    <dt>{a.peakDate}</dt>
                    <dd>
                      {fall.peakAt === null
                        ? a.initialPeak
                        : format.date.format(fall.peakAt)}
                    </dd>
                  </div>
                  <div>
                    <dt>{a.troughDate}</dt>
                    <dd>{format.date.format(fall.troughAt)}</dd>
                  </div>
                  <div>
                    <dt>{a.recovery}</dt>
                    <dd>
                      {fall.recoveredAt === null
                        ? a.notRecovered
                        : format.date.format(fall.recoveredAt)}
                    </dd>
                  </div>
                </>
              )}
            </dl>
          )}
        </Panel>
      </div>
      <Panel title={a.distribution} detail={a.measured + " · " + measured}>
        {measured ? (
          <div className="table compact-record-table">
            <table aria-label={a.distribution}>
              <thead>
                <tr>
                  <GroupCheckboxHeader selection={selection} />
                  <th>{a.range}</th>
                  <th>{a.trades}</th>
                  <th>{a.share}</th>
                  <th>{a.netR}</th>
                </tr>
              </thead>
              <tbody>
                {distribution.map((row) => (
                  <tr key={row.key}>
                    <GroupCheckbox
                      selection={selection}
                      groupKey={row.key}
                      label={R_BUCKET_LABELS[row.key]}
                    />
                    <th scope="row">
                      <button
                        type="button"
                        className="secondary"
                        aria-pressed={row.key === selected}
                        disabled={!row.count}
                        onClick={() =>
                          setSelected((current) =>
                            current === row.key ? undefined : row.key,
                          )
                        }
                      >
                        {R_BUCKET_LABELS[row.key]}
                      </button>
                    </th>
                    <td>{row.count}</td>
                    <td>
                      <div className="risk-bar">
                        <span
                          style={{ width: (row.count / measured) * 100 + "%" }}
                        />
                      </div>
                      <small>
                        {format.percentage.format(row.count / measured)}
                      </small>
                    </td>
                    <td>{row.count ? money(row.totalR) : EMPTY_VALUE}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>{a.noRisk}</p>
        )}
        <GroupSelectionSummary selection={selection} />
        {active && active.count > 0 && <TradeTable trades={active.records} />}
      </Panel>
      <details className="panel analytics-more">
        <summary>
          {a.stopOverrun} · {overruns.length}
        </summary>
        <p>{a.stopHint}</p>
        {overruns.length > 0 && (
          <>
            <p>
              {a.excessR} ·{" "}
              {money(overruns.reduce((sum, row) => sum + row.excessR, 0))} R
            </p>
            <TradeTable trades={overruns.map((row) => row.trade)} />
          </>
        )}
      </details>
    </>
  );
}
