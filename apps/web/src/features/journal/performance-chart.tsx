import { SeriesChart } from "../../shared/analytics/series-chart.tsx";
import { useLocale } from "../../shared/messages.ts";
import type { PerformanceChartProps } from "./types.ts";

export function PerformanceChart({ values }: PerformanceChartProps) {
  const { t } = useLocale();
  if (!values.length) {
    return (
      <div className="chart-empty">
        <strong>{t.noChart}</strong>
        <p>{t.chartHint}</p>
      </div>
    );
  }
  return (
    <SeriesChart
      signed
      values={values}
      label={t.cumulative}
      empty={t.noChart}
    />
  );
}
