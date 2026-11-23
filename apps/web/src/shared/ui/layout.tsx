import type { MetricProps, PanelProps, RecordActionsProps } from "./types.ts";

export function Panel({ title, detail, children }: PanelProps) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>{title}</h2>
        {detail != null && <div className="panel-detail">{detail}</div>}
      </div>
      {children}
    </section>
  );
}

export function Metric({ label, value, detail }: MetricProps) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </article>
  );
}

export function RecordActions({
  backHref,
  cancel,
  submit,
  saving,
  error,
}: RecordActionsProps) {
  return (
    <div className="record-form-footer">
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="record-form-actions">
        {saving ? (
          <button type="button" className="secondary" disabled>
            {cancel}
          </button>
        ) : (
          <a className="action-link secondary" href={backHref}>
            {cancel}
          </a>
        )}
        <button type="submit" disabled={saving}>
          {submit}
        </button>
      </div>
    </div>
  );
}
