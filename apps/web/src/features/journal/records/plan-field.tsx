import type { PlanFieldProps } from "./types.ts";

import { useLocale } from "../../../shared/messages.ts";
import { SelectField } from "../../../shared/ui/select-field.tsx";

export function PlanField({ options, value, onChange }: PlanFieldProps) {
  const { t } = useLocale();

  return (
    <SelectField
      label={t.linkedPlan}
      name="planId"
      value={value}
      disabled={!options.length}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">
        {options.length ? t.noLinkedPlan : t.noPlanOnDate}
      </option>
      {options.map(({ id, setup }) => (
        <option key={id} value={id}>
          {setup.symbol} · {setup.title}
        </option>
      ))}
    </SelectField>
  );
}
