import { TradeMetricCards } from "../../shared/analytics/trade-metric-cards.tsx";
import { useTradeCashSeries } from "../../shared/analytics/use-trade-cash-series.ts";
import { EMPTY_VALUE } from "../../shared/constants.ts";
import { numericTone } from "../../shared/format.ts";
import { useLocale } from "../../shared/messages.ts";
import { InfoTip } from "../../shared/ui/info-tip.tsx";
import { useStatisticsMessages } from "./messages.ts";
import type { StatisticsSummaryProps } from "./types.ts";

export function StatisticsSummary({ metrics, trades }: StatisticsSummaryProps) {
  const { t, format } = useLocale();
  const s = useStatisticsMessages();
  const values = useTradeCashSeries(trades);
  const decimal = (value: number | null) =>
    value === null ? EMPTY_VALUE : format.money.format(value);
  const facts = [
    [s.avgRR, decimal(metrics.payoff)],
    [
      s.expectancy,
      decimal(metrics.expectancy),
      numericTone(metrics.expectancy ?? 0),
    ],
    [
      s.expectancyR,
      decimal(metrics.expectancyR),
      numericTone(metrics.expectancyR ?? 0),
    ],
    [
      s.lowest,
      metrics.count ? decimal(metrics.lowestPnl) : EMPTY_VALUE,
      numericTone(metrics.lowestPnl),
    ],
    [
      s.averageWin,
      decimal(metrics.averageWin),
      numericTone(metrics.averageWin ?? 0),
    ],
    [
      s.averageLoss,
      decimal(metrics.averageLoss),
      numericTone(metrics.averageLoss ?? 0),
    ],
    [s.maxWin, format.integer.format(metrics.longestWin)],
    [s.maxLoss, format.integer.format(metrics.longestLoss)],
    [s.flat, format.integer.format(metrics.flat)],
    [s.avgDuration, decimal(metrics.duration.mean)],
    [s.medianDuration, decimal(metrics.duration.median)],
  ] as const;

  return (
    <>
      <TradeMetricCards stats={metrics} values={values} />
      <details className="panel analytics-more statistics-summary">
        <summary>{t.statistics}</summary>
        <dl className="statistics-facts">
          <div>
            <dt>
              {s.sample}{" "}
              <InfoTip label={s.sample} text={s.initialRiskCountHint} />
            </dt>
            <dd>{format.integer.format(metrics.countWithRisk)}</dd>
          </div>
          {facts.map(([label, value, tone]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd className={tone}>{value}</dd>
            </div>
          ))}
        </dl>
      </details>
    </>
  );
}
