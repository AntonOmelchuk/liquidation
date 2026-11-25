import { useState } from "react";
import type { FormEvent } from "react";
import {
  ENTRY_HOUR_SIDE,
  REVIEW_RULE,
} from "@liquidation/domain/review/constants";
import { reviewRuleSchema } from "@liquidation/domain/review/schemas";
import type { ReviewRule } from "@liquidation/domain/review/types";
import { SelectField } from "../../../shared/ui/select-field.tsx";
import { useReviewMessages } from "../messages.ts";
import type { RuleFormProps } from "../types.ts";

export function RuleForm({ symbols, onApply }: RuleFormProps) {
  const m = useReviewMessages();
  const [kind, setKind] = useState<ReviewRule["kind"]>(REVIEW_RULE.SYMBOLS);
  const [invalid, setInvalid] = useState(false);

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const rule = reviewRuleSchema.safeParse({
      kind,
      symbols: [
        ...new Set([fields.get("first"), fields.get("second")].filter(Boolean)),
      ],
      hour: Number(fields.get("hour") ?? NaN),
      side: fields.get("side"),
      hours: Number(fields.get("hours") ?? NaN),
    });
    setInvalid(!rule.success);
    if (rule.success) onApply(rule.data);
  }

  return (
    <form className="review-rule-form" onSubmit={apply}>
      <SelectField
        label={m.rule}
        value={kind}
        onChange={(event) => {
          const chosen = Object.values(REVIEW_RULE).find(
            (rule) => rule === event.target.value,
          );
          if (chosen) setKind(chosen);
          setInvalid(false);
        }}
      >
        {Object.values(REVIEW_RULE).map((key) => (
          <option key={key} value={key}>
            {m.rules[key]}
          </option>
        ))}
      </SelectField>
      {kind === REVIEW_RULE.SYMBOLS && (
        <>
          <SelectField label={m.firstSymbol} name="first" required>
            {symbols.map((symbol) => (
              <option key={symbol} value={symbol}>
                {symbol}
              </option>
            ))}
          </SelectField>
          <SelectField label={m.secondSymbol} name="second">
            <option value="">{m.oneSymbol}</option>
            {symbols.map((symbol) => (
              <option key={symbol} value={symbol}>
                {symbol}
              </option>
            ))}
          </SelectField>
        </>
      )}
      {kind === REVIEW_RULE.ENTRY_HOUR && (
        <>
          <SelectField label={m.rule} name="side">
            {Object.values(ENTRY_HOUR_SIDE).map((side) => (
              <option key={side} value={side}>
                {m.hourSides[side]}
              </option>
            ))}
          </SelectField>
          <label>
            {m.hour}
            <input
              name="hour"
              type="number"
              min={0}
              max={23}
              step={1}
              defaultValue={16}
              required
            />
          </label>
        </>
      )}
      {kind === REVIEW_RULE.MINIMUM_HOLD && (
        <label>
          {m.minimumHours}
          <input
            name="hours"
            type="number"
            min={1}
            max={72}
            step={1}
            defaultValue={4}
            required
          />
        </label>
      )}
      <button className="secondary" type="submit">
        {m.run}
      </button>
      {invalid && (
        <p className="error" role="alert">
          {m.invalidRule}
        </p>
      )}
    </form>
  );
}
