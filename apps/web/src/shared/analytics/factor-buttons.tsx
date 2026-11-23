import type { FactorButtonsProps } from "./types.ts";

export function FactorButtons<Factor extends string>({
  label,
  value,
  options,
  onChange,
}: FactorButtonsProps<Factor>) {
  return (
    <div className="analytics-factors" role="group" aria-label={label}>
      {options.map(({ key, label: text }) => (
        <button
          type="button"
          className="secondary"
          key={key}
          aria-pressed={value === key}
          onClick={() => onChange(key)}
        >
          {text}
        </button>
      ))}
    </div>
  );
}
