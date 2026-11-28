import { METRIC_ICON } from "./metric-constants.ts";
import type { MetricCardProps, MetricGridProps } from "./types.ts";
import "./metric-card.css";

export function MetricGrid({ label, compact, children }: MetricGridProps) {
  const Container = label ? "section" : "div";
  return (
    <Container
      className="metric-grid"
      data-compact={compact || undefined}
      aria-label={label}
    >
      {children}
    </Container>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  tone,
  icon,
  featured,
  children,
}: MetricCardProps) {
  return (
    <article
      className="metric-card"
      data-tone={tone}
      data-featured={featured || undefined}
    >
      <div className="metric-card-label">
        {icon && (
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.65"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={METRIC_ICON[icon]} />
          </svg>
        )}
        <span>{label}</span>
      </div>
      <div className="metric-card-result">
        <strong className="metric-card-value">{value}</strong>
        {children}
      </div>
      {detail != null && detail !== false && (
        <div className="metric-card-detail">{detail}</div>
      )}
    </article>
  );
}
