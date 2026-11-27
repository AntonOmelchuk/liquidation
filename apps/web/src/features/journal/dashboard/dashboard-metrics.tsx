import { SeriesChart } from "../../../shared/analytics/series-chart.tsx";
import { EMPTY_VALUE, LOCALES } from "../../../shared/constants.ts";
import {
  createCurrencyFormatter,
  numericTone,
} from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import { useWorkspaceMessages } from "../../workspace/messages.ts";
import { useJournal } from "../data/store.ts";
import { CHART_TONE } from "./constants.ts";
import { useDashboardMessages } from "./messages.ts";
import { SegmentedGauge } from "./segmented-gauge.tsx";
import type { DashboardMetricProps, DashboardMetricsProps } from "./types.ts";
import "./dashboard-metrics.css";

function DashboardMetric({
  label,
  value,
  tone,
  featured,
  children,
  detail,
}: DashboardMetricProps) {
  return (
    <article
      className="dashboard-metric"
      data-featured={featured || undefined}
      data-pnl={tone}
    >
      <h2>{label}</h2>
      <div className="dashboard-metric-result">
        <strong className={tone}>{value}</strong>
        {children}
      </div>
      {detail && <div className="dashboard-metric-detail">{detail}</div>}
    </article>
  );
}

export function DashboardMetrics({
  stats,
  values,
  ready,
}: DashboardMetricsProps) {
  const { t, language, format } = useLocale();
  const m = useWorkspaceMessages();
  const labels = useDashboardMessages();
  const currency = useJournal((state) => state.currency);
  const locale = LOCALES[language];
  const money = createCurrencyFormatter(locale, currency);
  const signed = createCurrencyFormatter(locale, currency, {
    signDisplay: "exceptZero",
  });
  const count = (value: number) => format.integer.format(value);
  const outcomes = [
    { tone: CHART_TONE.WIN, value: stats.wins, label: labels.wins },
    { tone: CHART_TONE.FLAT, value: stats.flat, label: labels.flat },
    { tone: CHART_TONE.LOSS, value: stats.losses, label: labels.losses },
  ];
  const gains = [
    {
      tone: CHART_TONE.WIN,
      value: stats.winningPnl,
      label: labels.winningPnl,
      amount: stats.winningPnl,
    },
    {
      tone: CHART_TONE.LOSS,
      value: stats.losingPnl,
      label: labels.losingPnl,
      amount: -stats.losingPnl,
    },
  ];
  const averages = [
    { tone: CHART_TONE.WIN, value: stats.averageWin, label: labels.averageWin },
    {
      tone: CHART_TONE.LOSS,
      value: stats.averageLoss,
      label: labels.averageLoss,
    },
  ];
  let peak = 0;
  const drawdowns = values.map((value) => {
    peak = Math.max(peak, value);
    return value - peak;
  });

  return (
    <section className="dashboard-metrics" aria-label={t.statistics}>
      <DashboardMetric
        label={t.pnl}
        value={ready ? signed.format(stats.net) : EMPTY_VALUE}
        tone={numericTone(stats.net)}
        featured
        detail={ready ? t.count + " · " + count(stats.count) : undefined}
      >
        {values.length > 0 && (
          <SeriesChart
            compact
            signed
            values={values}
            label={t.cumulative}
            empty={t.noChart}
          />
        )}
      </DashboardMetric>
      <DashboardMetric
        label={t.profitFactor}
        value={
          stats.profitFactor === null
            ? EMPTY_VALUE
            : format.money.format(stats.profitFactor)
        }
        detail={
          stats.count > 0 && (
            <div className="dashboard-metric-breakdown">
              {gains.map(({ tone, label, amount }) => (
                <span key={tone} data-tone={tone} title={label}>
                  {signed.format(amount)}
                </span>
              ))}
            </div>
          )
        }
      >
        <SegmentedGauge
          segments={gains}
          label={gains
            .map(({ label, amount }) => label + " · " + signed.format(amount))
            .join(", ")}
        />
      </DashboardMetric>
      <DashboardMetric
        label={t.win}
        value={
          stats.winRate === null
            ? EMPTY_VALUE
            : format.percentage.format(stats.winRate)
        }
        detail={
          stats.count > 0 && (
            <div className="dashboard-outcomes">
              {outcomes.map(({ tone, label, value }) => (
                <span key={tone} data-tone={tone} title={label}>
                  <i aria-hidden="true" />
                  {count(value)}
                </span>
              ))}
            </div>
          )
        }
      >
        <SegmentedGauge
          semicircle
          segments={outcomes}
          label={outcomes
            .map(({ label, value }) => label + " · " + count(value))
            .join(", ")}
        />
      </DashboardMetric>
      <DashboardMetric
        label={m.expectancy}
        value={
          stats.expectancy === null
            ? EMPTY_VALUE
            : signed.format(stats.expectancy)
        }
        tone={numericTone(stats.expectancy ?? 0)}
        detail={
          stats.count > 0 && (
            <div className="dashboard-averages">
              <span>{labels.averageTrade}</span>
              <div
                className="dashboard-average-bar"
                role="img"
                aria-label={averages
                  .map(
                    ({ label, value }) =>
                      label +
                      " · " +
                      (value === null ? EMPTY_VALUE : signed.format(value)),
                  )
                  .join(", ")}
              >
                {averages.map(({ tone, value }) => (
                  <span
                    key={tone}
                    data-tone={tone}
                    style={{ flexGrow: Math.abs(value ?? 0) }}
                  />
                ))}
              </div>
              <div className="dashboard-metric-breakdown">
                {averages.map(({ tone, label, value }) => (
                  <span key={tone} data-tone={tone} title={label}>
                    {value === null ? EMPTY_VALUE : signed.format(value)}
                  </span>
                ))}
              </div>
            </div>
          )
        }
      />
      <DashboardMetric
        label={m.maxDrawdown}
        value={stats.count ? money.format(stats.maxDrawdown) : EMPTY_VALUE}
        tone={numericTone(-stats.maxDrawdown)}
        detail={stats.count ? labels.peakToTrough : undefined}
      >
        {drawdowns.length > 0 && (
          <SeriesChart
            compact
            signed
            values={drawdowns}
            label={labels.drawdown}
            empty={t.noChart}
          />
        )}
      </DashboardMetric>
    </section>
  );
}
