import { SeriesChart } from "../../shared/analytics/series-chart.tsx";
import { useTradeMetricMessages } from "../../shared/analytics/trade-metric-messages.ts";
import { EMPTY_VALUE } from "../../shared/constants.ts";
import { numericTone } from "../../shared/format.ts";
import { useLocale } from "../../shared/messages.ts";
import { MetricCard, MetricGrid } from "../../shared/ui/metric-card.tsx";
import { METRIC_TONE } from "../../shared/ui/metric-constants.ts";
import { metricParts } from "../../shared/ui/metric-parts.ts";
import { MetricGauge } from "../../shared/ui/metric-visuals.tsx";
import { useAccountMessages } from "./messages.ts";
import type { AccountSummaryProps } from "./types.ts";

export function AccountSummary({ account, performance }: AccountSummaryProps) {
  const { t, format } = useLocale();
  const m = useAccountMessages();
  const labels = useTradeMetricMessages();
  const money = (value: number) =>
    format.money.format(value) + " " + account.currency;
  const rate =
    performance.returnRate === null
      ? EMPTY_VALUE
      : format.percentage.format(performance.returnRate);
  const { points, stats } = performance;
  const unit = " " + account.currency;
  const outcomes = metricParts(format.integer, [
    [METRIC_TONE.POSITIVE, labels.wins, stats.wins],
    [METRIC_TONE.NEUTRAL, labels.flat, stats.flat],
    [METRIC_TONE.NEGATIVE, labels.losses, stats.losses],
  ]);
  return (
    <>
      <MetricGrid label={m.accounts}>
        <MetricCard
          label={m.balance}
          value={money(performance.balance)}
          icon="WALLET"
          featured
        >
          <SeriesChart
            compact
            label={m.balanceHistory}
            values={
              points.length
                ? [
                    account.startingBalance,
                    ...points.map(({ balance }) => balance),
                  ]
                : []
            }
            unit={unit}
          />
        </MetricCard>
        <MetricCard
          label={m.tradePnl}
          value={money(stats.net)}
          tone={numericTone(stats.net)}
          icon="ACTIVITY"
          detail={t.count + " · " + format.integer.format(stats.count)}
        >
          <MetricGauge parts={outcomes} semicircle />
        </MetricCard>
        <MetricCard
          label={m.performance}
          value={money(performance.performance)}
          icon="TREND"
          tone={numericTone(performance.performance)}
        >
          <SeriesChart
            compact
            signed
            label={m.performance}
            values={
              points.length
                ? [0, ...points.map((point) => point.performance)]
                : []
            }
            unit={unit}
          />
        </MetricCard>
        <MetricCard
          label={m.returnRate}
          value={rate}
          icon="TARGET"
          tone={numericTone(performance.returnRate ?? 0) ?? METRIC_TONE.NEUTRAL}
          detail={m.funded + " · " + money(performance.funded)}
        />
        <MetricCard
          label={m.openRisk}
          value={money(performance.openRisk)}
          icon="WARNING"
          tone={
            performance.openRisk || performance.riskUnknown
              ? METRIC_TONE.CAUTION
              : undefined
          }
          detail={
            m.positions +
            " · " +
            performance.positions +
            (performance.riskUnknown
              ? " · " + m.unknownRisk + " " + performance.riskUnknown
              : "")
          }
        />
      </MetricGrid>
      <dl className="statistics-facts account-balance-facts">
        <div>
          <dt>{m.maxDrawdown}</dt>
          <dd>
            {money(performance.maxDrawdown)}
            {performance.maxDrawdownRate !== null &&
              " · " + format.percentage.format(performance.maxDrawdownRate)}
          </dd>
        </div>
        {[
          [m.startingBalance, account.startingBalance],
          [m.deposits, performance.deposits],
          [m.withdrawals, performance.withdrawals],
          [m.fees, performance.fees],
          [m.corrections, performance.corrections],
        ].map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{money(Number(value))}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
