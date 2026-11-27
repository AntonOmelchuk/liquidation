import { useId } from "react";
import { useLocale } from "../messages.ts";
import type { SeriesChartProps } from "./types.ts";

export function SeriesChart({
  compact = false,
  signed = false,
  values,
  label,
  empty,
  unit = "",
}: SeriesChartProps) {
  const { format } = useLocale();
  const gradient = useId();
  const lineGradient = useId();
  if (!values.length) return <p className="subdued">{empty}</p>;
  let maximum = signed ? 0 : values[0];
  let minimum = signed ? 0 : values[0];
  for (const value of values) {
    maximum = Math.max(maximum, value);
    minimum = Math.min(minimum, value);
  }
  const hasPolarity = signed && (minimum < 0 || maximum > 0);
  if (minimum === maximum) {
    minimum -= 1;
    maximum += 1;
  }
  const height = compact ? 52 : 180;
  const width = compact ? 120 : 900;
  const padding = compact ? 4 : 8;
  const y = (value: number) =>
    padding +
    ((maximum - value) / (maximum - minimum)) * (height - padding * 2);
  const zero = y(0);
  const zeroOffset = (zero / height) * 100 + "%";
  const fillBase = signed ? zero : height;
  const stroke = hasPolarity
    ? `url(#${lineGradient})`
    : signed
      ? "var(--chart-flat)"
      : "currentColor";
  const path = values
    .map((value, index) => {
      const x =
        values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
      return (index ? "L" : "M") + x + "," + y(value);
    })
    .join(" ");
  const show = (value: number) => format.money.format(value) + unit;
  return (
    <div
      className={
        compact
          ? "chart series-chart series-chart-compact"
          : "chart series-chart"
      }
    >
      {!compact && (
        <div className="chart-scale" aria-hidden="true">
          <span>{show(maximum)}</span>
          <span>{show(minimum)}</span>
        </div>
      )}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={label + " · " + show(values[values.length - 1])}
      >
        <defs>
          <linearGradient
            id={gradient}
            x1="0"
            x2="0"
            y1="0"
            y2={height}
            gradientUnits="userSpaceOnUse"
          >
            {hasPolarity ? (
              <>
                <stop stopColor="var(--chart-win)" stopOpacity=".32" />
                <stop
                  offset={zeroOffset}
                  stopColor="var(--chart-win)"
                  stopOpacity=".04"
                />
                <stop
                  offset={zeroOffset}
                  stopColor="var(--chart-loss)"
                  stopOpacity=".04"
                />
                <stop
                  offset="100%"
                  stopColor="var(--chart-loss)"
                  stopOpacity=".3"
                />
              </>
            ) : (
              <>
                <stop stopColor="currentColor" stopOpacity=".18" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </>
            )}
          </linearGradient>
          {hasPolarity && (
            <linearGradient
              id={lineGradient}
              x1="0"
              x2="0"
              y1="0"
              y2={height}
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="var(--chart-win)" />
              <stop offset={zeroOffset} stopColor="var(--chart-win)" />
              <stop offset={zeroOffset} stopColor="var(--chart-loss)" />
              <stop offset="100%" stopColor="var(--chart-loss)" />
            </linearGradient>
          )}
        </defs>
        {minimum <= 0 && maximum >= 0 && (
          <line
            className="baseline"
            x1="0"
            x2={width}
            y1={zero}
            y2={zero}
            vectorEffect="non-scaling-stroke"
          />
        )}
        {values.length > 1 && (
          <path
            d={path + ` L${width},${fillBase} L0,${fillBase} Z`}
            fill={`url(#${gradient})`}
          />
        )}
        <path
          d={path}
          stroke={stroke}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          fill="none"
        />
      </svg>
    </div>
  );
}
