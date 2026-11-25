import { EMPTY_VALUE } from "../../shared/constants.ts";
import { useLocale } from "../../shared/messages.ts";
import { Metric } from "../../shared/ui/layout.tsx";
import { useStatisticsMessages } from "./messages.ts";
import type { StatisticsSummaryProps } from "./types.ts";

export function StatisticsSummary({ metrics }: StatisticsSummaryProps) {
  const { t, format } = useLocale();
  const s = useStatisticsMessages();
  const decimal = (value: number | null) =>
    value === null ? EMPTY_VALUE : format.money.format(value);
  const facts = [
    [s.avgRR, decimal(metrics.payoff)],
    [s.expectancy, decimal(metrics.expectancy)],
    [s.expectancyR, decimal(metrics.expectancyR)],
    [s.sample, format.integer.format(metrics.countWithRisk)],
    [s.lowest, metrics.count ? decimal(metrics.lowestPnl) : EMPTY_VALUE],
    [s.averageWin, decimal(metrics.averageWin)],
    [s.averageLoss, decimal(metrics.averageLoss)],
    [s.maxWin, format.integer.format(metrics.longestWin)],
    [s.maxLoss, format.integer.format(metrics.longestLoss)],
    [s.flat, format.integer.format(metrics.flat)],
    [s.avgDuration, decimal(metrics.duration.mean)],
    [s.medianDuration, decimal(metrics.duration.median)],
  ];

  return (
    <>
      <section className="metrics statistics-metrics" aria-label={t.statistics}>
        <Metric
          label={t.pnl}
          value={decimal(metrics.net)}
          detail={`${t.count} · ${format.integer.format(metrics.count)}`}
        />
        <Metric label={t.profitFactor} value={decimal(metrics.profitFactor)} />
        <Metric label={s.expectancy} value={decimal(metrics.expectancy)} />
        <Metric
          label={t.win}
          value={
            metrics.winRate === null
              ? EMPTY_VALUE
              : format.percentage.format(metrics.winRate)
          }
        />
        <Metric
          label={s.drawdown}
          value={metrics.count ? decimal(metrics.maxDrawdown) : EMPTY_VALUE}
        />
      </section>
      <details className="panel analytics-more statistics-summary">
        <summary>{t.statistics}</summary>
        <dl className="statistics-facts">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </details>
    </>
  );
}
