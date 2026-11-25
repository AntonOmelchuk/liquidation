import type { CheckboxFieldProps } from "./types.ts";
import "./checkbox-field.css";

export function CheckboxField({
  children,
  className,
  ...input
}: CheckboxFieldProps) {
  return (
    <label
      className={className ? "checkbox-field " + className : "checkbox-field"}
    >
      <input {...input} type="checkbox" className="visually-hidden" />
      <span className="checkbox-box" aria-hidden="true" />
      {children != null && <span className="checkbox-text">{children}</span>}
    </label>
  );
}
