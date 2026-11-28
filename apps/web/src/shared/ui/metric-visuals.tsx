import { MetricBar } from "./metric-bar.tsx";
import { describeMetricParts } from "./metric-parts.ts";
import type { MetricPartsProps } from "./types.ts";
import "./metric-visuals.css";

const circlePath = "M40 8 a32 32 0 1 1 0 64 a32 32 0 1 1 0 -64";
const semicirclePath = "M8 40 A32 32 0 0 1 72 40";

export function MetricGauge({
  parts,
  semicircle,
}: MetricPartsProps & { semicircle?: boolean }) {
  const total = parts.reduce((sum, { value }) => sum + value, 0);
  if (!total) return null;
  const path = semicircle ? semicirclePath : circlePath;
  const label = describeMetricParts(parts);
  let offset = 0;
  return (
    <svg
      className={semicircle ? "metric-gauge metric-semicircle" : "metric-gauge"}
      viewBox={semicircle ? "0 0 80 48" : "0 0 80 80"}
      role="img"
      aria-label={label}
    >
      <title>{label}</title>
      <path className="metric-gauge-track" d={path} />
      {parts.map(({ tone, value, label }) => {
        if (value <= 0) return null;
        const span = (100 * value) / total;
        const start = offset;
        offset += span;
        return (
          <path
            key={label}
            className="metric-gauge-segment"
            data-tone={tone}
            d={path}
            pathLength={100}
            strokeDasharray={`${span} 100`}
            strokeDashoffset={-start}
          />
        );
      })}
    </svg>
  );
}

export function MetricDistribution({ parts }: MetricPartsProps) {
  const total = parts.reduce((sum, { value }) => sum + value, 0);
  return total ? (
    <MetricBar
      label={describeMetricParts(parts)}
      segments={parts.map(({ tone, value }) => ({
        tone,
        ratio: value / total,
      }))}
    />
  ) : null;
}

export function MetricLegend({
  parts,
  names = false,
}: MetricPartsProps & { names?: boolean }) {
  return (
    <ul className="metric-legend">
      {parts.map(({ label, text, tone }) => (
        <li key={label} data-tone={tone} title={label}>
          <span className="metric-legend-dot" aria-hidden="true" />
          <span className={names ? undefined : "visually-hidden"}>{label}</span>
          <strong>{text}</strong>
        </li>
      ))}
    </ul>
  );
}
