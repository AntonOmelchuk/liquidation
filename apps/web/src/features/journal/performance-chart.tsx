import { netCents } from "@liquidation/domain/trades/trade";
import { useLocale } from "../../shared/messages.ts";
import type { PerformanceChartProps } from "./types.ts";
export function PerformanceChart({ trades }: PerformanceChartProps) {
  const {
    t,
    format: { money },
  } = useLocale();
  if (!trades.length) {
    return (
      <div className="chart-empty">
        <strong>{t.noChart}</strong>
        <p>{t.chartHint}</p>
      </div>
    );
  }

  let balance = 0;
  let low = 0;
  let high = 0;
  const values = [0];
  for (const trade of trades.toSorted(
    (a, b) => Date.parse(a.closedAt) - Date.parse(b.closedAt),
  )) {
    balance += netCents(trade);
    values.push(balance);
    low = Math.min(low, balance);
    high = Math.max(high, balance);
  }
  const range = high - low || 100;
  const y = (value: number) => 10 + ((high - value) / range) * 180;
  const path = values
    .map(
      (value, index) =>
        `${index === 0 ? "M" : "L"}${(index / (values.length - 1)) * 900},${y(value)}`,
    )
    .join(" ");
  return (
    <div className="chart">
      <div className="chart-scale" aria-hidden="true">
        <span>{money.format(high / 100)}</span>
        <span>{money.format(low / 100)}</span>
      </div>
      <svg
        viewBox="0 0 900 200"
        preserveAspectRatio="none"
        role="img"
        aria-label={`${t.cumulative}: ${money.format(balance / 100)}`}
      >
        <defs>
          <linearGradient id="chart-fill" x2="0" y2="1">
            <stop stopColor="currentColor" stopOpacity=".24" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${path} L900,200 L0,200 Z`} fill="url(#chart-fill)" />
        <line
          x1="0"
          x2="900"
          y1={y(0)}
          y2={y(0)}
          className="baseline"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
