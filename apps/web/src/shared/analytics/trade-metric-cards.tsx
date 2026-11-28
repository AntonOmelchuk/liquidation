import { EMPTY_VALUE, LOCALES } from "../constants.ts";
import { createCurrencyFormatter, numericTone } from "../format.ts";
import { useLocale } from "../messages.ts";
import { MetricCard, MetricGrid } from "../ui/metric-card.tsx";
import { METRIC_TONE } from "../ui/metric-constants.ts";
import { metricParts } from "../ui/metric-parts.ts";
import {
  MetricDistribution,
  MetricGauge,
  MetricLegend,
} from "../ui/metric-visuals.tsx";
import { SeriesChart } from "./series-chart.tsx";
import { useTradeMetricMessages } from "./trade-metric-messages.ts";
import type { TradeMetricCardsProps } from "./types.ts";

export function TradeMetricCards({
  stats,
  values,
  currency,
  ready = true,
  overviewOnly,
}: TradeMetricCardsProps) {
  const { t, format, language } = useLocale();
  const m = useTradeMetricMessages();
  const locale = LOCALES[language];
  const money = currency
    ? createCurrencyFormatter(locale, currency)
    : format.money;
  const signed = new Intl.NumberFormat(locale, {
    ...money.resolvedOptions(),
    signDisplay: "exceptZero",
  });
  const count = format.integer.format(stats.count);
  const outcomes = metricParts(format.integer, [
    [METRIC_TONE.POSITIVE, m.wins, stats.wins],
    [METRIC_TONE.NEUTRAL, m.flat, stats.flat],
    [METRIC_TONE.NEGATIVE, m.losses, stats.losses],
  ]);
  const gains = metricParts(signed, [
    [METRIC_TONE.POSITIVE, m.winningPnl, stats.winningPnl],
    [METRIC_TONE.NEGATIVE, m.losingPnl, -stats.losingPnl],
  ]);
  const averages = metricParts(signed, [
    [METRIC_TONE.POSITIVE, m.averageWin, stats.averageWin],
    [METRIC_TONE.NEGATIVE, m.averageLoss, stats.averageLoss],
  ]);
  let peak = 0;
  const drawdowns = values.map((value) => {
    peak = Math.max(peak, value);
    return value - peak;
  });
  const chartUnit = currency ? " " + currency : undefined;

  return (
    <MetricGrid label={t.statistics}>
      <MetricCard
        label={t.pnl}
        value={ready ? signed.format(stats.net) : EMPTY_VALUE}
        tone={numericTone(stats.net) ?? METRIC_TONE.NEUTRAL}
        icon="TREND"
        featured
        detail={ready ? t.count + " · " + count : undefined}
      >
        <SeriesChart
          compact
          signed
          values={values}
          unit={chartUnit}
          label={t.cumulative}
        />
      </MetricCard>
      <MetricCard
        label={t.profitFactor}
        value={
          stats.profitFactor === null
            ? EMPTY_VALUE
            : format.money.format(stats.profitFactor)
        }
        tone={
          stats.profitFactor === null
            ? METRIC_TONE.NEUTRAL
            : (numericTone(stats.profitFactor - 1) ?? METRIC_TONE.NEUTRAL)
        }
        icon="SCALE"
        detail={
          gains.some(({ value }) => value > 0) && <MetricLegend parts={gains} />
        }
      >
        <MetricGauge parts={gains} />
      </MetricCard>
      <MetricCard
        label={t.win}
        value={
          stats.winRate === null
            ? EMPTY_VALUE
            : format.percentage.format(stats.winRate)
        }
        icon="TARGET"
        detail={stats.count > 0 && <MetricLegend parts={outcomes} />}
      >
        <MetricGauge parts={outcomes} semicircle />
      </MetricCard>
      {!overviewOnly && (
        <>
          <MetricCard
            label={m.expectancy}
            value={
              stats.expectancy === null
                ? EMPTY_VALUE
                : signed.format(stats.expectancy)
            }
            tone={numericTone(stats.expectancy ?? 0)}
            icon="ACTIVITY"
            detail={
              stats.count > 0 && (
                <>
                  <span>{m.averageTrade}</span>
                  <MetricDistribution parts={averages} />
                  <MetricLegend parts={averages} />
                </>
              )
            }
          />
          <MetricCard
            label={m.maxDrawdown}
            value={stats.count ? money.format(stats.maxDrawdown) : EMPTY_VALUE}
            tone={numericTone(-stats.maxDrawdown) ?? METRIC_TONE.NEUTRAL}
            icon="DRAWDOWN"
            detail={stats.count ? m.peakToTrough : undefined}
          >
            <SeriesChart
              compact
              signed
              values={drawdowns}
              unit={chartUnit}
              label={m.drawdown}
            />
          </MetricCard>
        </>
      )}
    </MetricGrid>
  );
}
