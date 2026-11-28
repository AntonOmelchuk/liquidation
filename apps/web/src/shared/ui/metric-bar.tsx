import type { MetricBarProps } from "./types.ts";
import "./metric-bar.css";

export function MetricBar({ segments, label }: MetricBarProps) {
  return (
    <span
      className="metric-bar"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      title={label}
    >
      {segments.map(({ tone, ratio }) => (
        <span
          key={tone}
          data-tone={tone}
          style={{ inlineSize: `${ratio * 100}%` }}
        />
      ))}
    </span>
  );
}
