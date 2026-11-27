import type { SegmentedGaugeProps } from "./types.ts";

const circlePath = "M40 8 a32 32 0 1 1 0 64 a32 32 0 1 1 0 -64";
const semicirclePath = "M8 40 A32 32 0 0 1 72 40";

export function SegmentedGauge({
  segments,
  label,
  semicircle = false,
}: SegmentedGaugeProps) {
  const total = segments.reduce((sum, { value }) => sum + value, 0);
  const path = semicircle ? semicirclePath : circlePath;
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
      {total > 0 &&
        segments
          .filter(({ value }) => value > 0)
          .map(({ tone, value }) => {
            const span = (100 * value) / total;
            const start = offset;
            offset += span;
            return (
              <path
                key={tone}
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
