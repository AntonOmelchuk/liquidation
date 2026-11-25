import { useId } from "react";
import { useLocale } from "../messages.ts";
import type { SeriesChartProps } from "./types.ts";

export function SeriesChart({
  values,
  label,
  empty,
  unit = "",
}: SeriesChartProps) {
  const { format } = useLocale();
  const gradient = useId();
  if (!values.length) return <p className="subdued">{empty}</p>;
  let maximum = values[0];
  let minimum = values[0];
  for (const value of values) {
    maximum = Math.max(maximum, value);
    minimum = Math.min(minimum, value);
  }
  if (minimum === maximum) {
    minimum -= 1;
    maximum += 1;
  }
  const height = 180;
  const width = 900;
  const y = (value: number) =>
    8 + ((maximum - value) / (maximum - minimum)) * (height - 16);
  const path = values
    .map((value, index) => {
      const x =
        values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
      return (index ? "L" : "M") + x + "," + y(value);
    })
    .join(" ");
  const show = (value: number) => format.money.format(value) + unit;
  return (
    <div className="chart series-chart">
      <div className="chart-scale" aria-hidden="true">
        <span>{show(maximum)}</span>
        <span>{show(minimum)}</span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={label + " · " + show(values[values.length - 1])}
      >
        <defs>
          <linearGradient id={gradient} x2="0" y2="1">
            <stop stopColor="currentColor" stopOpacity=".18" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        {minimum <= 0 && maximum >= 0 && (
          <line
            className="baseline"
            x1="0"
            x2={width}
            y1={y(0)}
            y2={y(0)}
            vectorEffect="non-scaling-stroke"
          />
        )}
        {values.length > 1 && (
          <path
            d={path + ` L${width},${height} L0,${height} Z`}
            fill={`url(#${gradient})`}
          />
        )}
        <path
          d={path}
          stroke="currentColor"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          fill="none"
        />
      </svg>
    </div>
  );
}
