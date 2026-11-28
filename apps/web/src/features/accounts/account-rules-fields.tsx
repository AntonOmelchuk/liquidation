import {
  DEFAULT_ACCOUNT_TIME_ZONE,
  DEFAULT_FIRM_DAY_START,
  LIMIT_UNIT,
  MAX_LOSS_MODE,
} from "@liquidation/domain/accounts/constants";
import { CheckboxField } from "../../shared/ui/checkbox-field.tsx";
import { SelectField } from "../../shared/ui/select-field.tsx";
import { useAccountMessages } from "./messages.ts";
import type { AccountRulesFieldsProps, LimitFieldProps } from "./types.ts";

function LimitField({ name, initial }: LimitFieldProps) {
  const m = useAccountMessages();
  return (
    <div className="account-limit-field">
      <label>
        {m[name]}
        <input
          type="number"
          name={name}
          step="any"
          min={0.0001}
          defaultValue={initial?.value}
        />
      </label>
      <SelectField
        name={name + "Unit"}
        label={m.money + " / %"}
        defaultValue={initial?.unit ?? LIMIT_UNIT.PERCENT}
      >
        {Object.values(LIMIT_UNIT).map((unit) => (
          <option key={unit} value={unit}>
            {m[unit]}
          </option>
        ))}
      </SelectField>
    </div>
  );
}

function readLimit(form: FormData, name: LimitFieldProps["name"]) {
  const value = String(form.get(name) ?? "").trim();
  return value
    ? { value: Number(value), unit: form.get(name + "Unit") }
    : undefined;
}
export function readAccountRules(form: FormData) {
  if (!form.has("enableRules")) return undefined;
  const minimum = String(form.get("minimumDays") ?? "").trim();
  return {
    dailyLimit: readLimit(form, "dailyLimit"),
    countClosed: form.has("countClosed"),
    countOpenRisk: form.has("countOpenRisk"),
    maxLoss: readLimit(form, "maxLoss"),
    maxLossMode: form.get("maxLossMode"),
    target: readLimit(form, "target"),
    minimumDays: minimum ? Number(minimum) : undefined,
    timeZone: form.get("timeZone"),
    dayStart: form.get("dayStart"),
  };
}

export function AccountRulesFields({ initial }: AccountRulesFieldsProps) {
  const m = useAccountMessages();
  return (
    <div className="layout">
      <div className="record-field-grid">
        <LimitField name="dailyLimit" initial={initial?.dailyLimit} />
        <LimitField name="maxLoss" initial={initial?.maxLoss} />
        <LimitField name="target" initial={initial?.target} />
        <SelectField
          label={m.maxLossMode}
          name="maxLossMode"
          defaultValue={initial?.maxLossMode ?? MAX_LOSS_MODE.STATIC}
        >
          {Object.values(MAX_LOSS_MODE).map((mode) => (
            <option key={mode} value={mode}>
              {m[mode]}
            </option>
          ))}
        </SelectField>
        <label>
          {m.minimumDays}
          <input
            type="number"
            name="minimumDays"
            min={1}
            step={1}
            defaultValue={initial?.minimumDays}
          />
        </label>
        <label>
          {m.dayStart}
          <input
            type="time"
            name="dayStart"
            required
            defaultValue={initial?.dayStart ?? DEFAULT_FIRM_DAY_START}
          />
        </label>
        <label>
          {m.timeZone}
          <input
            name="timeZone"
            required
            defaultValue={
              initial?.timeZone ??
              Intl.DateTimeFormat().resolvedOptions().timeZone ??
              DEFAULT_ACCOUNT_TIME_ZONE
            }
          />
        </label>
      </div>
      <CheckboxField
        name="countClosed"
        defaultChecked={initial?.countClosed ?? true}
      >
        {m.dailyCountsClosed}
      </CheckboxField>
      <CheckboxField
        name="countOpenRisk"
        defaultChecked={initial?.countOpenRisk ?? true}
      >
        {m.dailyCountsOpen}
      </CheckboxField>
      <p className="analytics-hint">{m.rulesHint}</p>
    </div>
  );
}
