import { useEffect, useRef } from "react";
import type {
  PanelProps,
  RecordActionsProps,
  RecordHeadingProps,
} from "./types.ts";

export function Panel({ id, title, detail, children }: PanelProps) {
  return (
    <section className="panel" id={id}>
      <div className="panel-heading">
        <h2>{title}</h2>
        {detail != null && <div className="panel-detail">{detail}</div>}
      </div>
      {children}
    </section>
  );
}

export function RecordHeading({
  title,
  backHref,
  backLabel,
  meta,
  actions,
}: RecordHeadingProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    window.scrollTo(0, 0);
    heading.current?.focus({ preventScroll: true });
  }, []);
  return (
    <>
      <a className="record-back" href={backHref}>
        ← {backLabel}
      </a>
      <header className="page-heading plan-detail-heading">
        <div>
          <h1 ref={heading} tabIndex={-1}>
            {title}
          </h1>
          {meta && <div className="plan-detail-meta">{meta}</div>}
        </div>
        {actions && <div className="workspace-actions">{actions}</div>}
      </header>
    </>
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
