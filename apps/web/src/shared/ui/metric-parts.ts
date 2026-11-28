import { EMPTY_VALUE } from "../constants.ts";
import type { MetricFigure, MetricPart } from "./types.ts";

export function metricParts(
  formatter: Intl.NumberFormat,
  figures: readonly MetricFigure[],
): MetricPart[] {
  return figures.map(([tone, label, value]) => ({
    tone,
    label,
    value: Math.abs(value ?? 0),
    text: value === null ? EMPTY_VALUE : formatter.format(value),
  }));
}

export function describeMetricParts(parts: readonly MetricPart[]) {
  return parts.map(({ label, text }) => `${label} · ${text}`).join(", ");
}
