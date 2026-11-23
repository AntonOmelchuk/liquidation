import type { SelectFieldProps } from "./types.ts";

export function SelectField({ label, children, ...props }: SelectFieldProps) {
  return (
    <label className="select-field">
      <span>{label}</span>
      <span className="select-control">
        <select {...props}>{children}</select>
        <svg aria-hidden="true" viewBox="0 0 16 16" fill="none">
          <path
            d="m4 6 4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </label>
  );
}
