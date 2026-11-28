import { useLayoutEffect, useRef } from "react";
import type { CheckboxFieldProps } from "./types.ts";
import "./checkbox-field.css";

export function CheckboxField({
  children,
  className,
  indeterminate = false,
  ...input
}: CheckboxFieldProps) {
  const ref = useRef<HTMLInputElement>(null);
  useLayoutEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <label
      className={className ? "checkbox-field " + className : "checkbox-field"}
    >
      <input {...input} ref={ref} type="checkbox" className="visually-hidden" />
      <span className="checkbox-box" aria-hidden="true" />
      {children != null && <span className="checkbox-text">{children}</span>}
    </label>
  );
}
