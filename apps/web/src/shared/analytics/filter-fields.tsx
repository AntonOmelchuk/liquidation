import { SelectField } from "../ui/select-field.tsx";
import type { AnalyticsSelectProps, DateRangeFieldsProps } from "./types.ts";

export function AnalyticsSelect({
  label,
  all,
  value,
  options,
  onChange,
}: AnalyticsSelectProps) {
  return (
    <SelectField
      label={label}
      value={value === undefined ? "" : `=${value}`}
      onChange={(event) => {
        const key = event.currentTarget.value;
        onChange(key ? key.slice(1) : undefined);
      }}
    >
      <option value="">{all}</option>
      {options.map(({ key, label: text }) => (
        <option key={key} value={`=${key}`}>
          {text}
        </option>
      ))}
    </SelectField>
  );
}

export function DateRangeFields({
  range,
  fromLabel,
  throughLabel,
  invalid,
  hintId,
  onChange,
}: DateRangeFieldsProps) {
  return (
    <>
      <label>
        {fromLabel}
        <input
          type="date"
          value={range.from}
          aria-describedby={hintId}
          aria-invalid={invalid || undefined}
          onChange={(event) => onChange({ ...range, from: event.target.value })}
        />
      </label>
      <label>
        {throughLabel}
        <input
          type="date"
          value={range.through}
          aria-describedby={hintId}
          aria-invalid={invalid || undefined}
          onChange={(event) =>
            onChange({ ...range, through: event.target.value })
          }
        />
      </label>
    </>
  );
}
