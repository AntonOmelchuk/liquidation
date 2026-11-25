import {
  ACCOUNT_RECORD,
  MAX_ACCOUNT_TEXT_LENGTH,
  MOVEMENT_KIND,
} from "@liquidation/domain/accounts/constants";
import { useState } from "react";
import type { FormEvent } from "react";
import { isoToLocalDateTime, localDateTimeToIso } from "../../shared/format.ts";
import { useLocale } from "../../shared/messages.ts";
import { SelectField } from "../../shared/ui/select-field.tsx";
import { useAccountMessages } from "./messages.ts";
import type { MovementEditorProps } from "./types.ts";
import { useAccountSave } from "./use-account-save.ts";

export function MovementEditor({
  account,
  movement,
  onClose,
}: MovementEditorProps) {
  const { t } = useLocale();
  const m = useAccountMessages();
  const [id] = useState(() => movement?.id ?? crypto.randomUUID());
  const [revision] = useState(movement?.revision);
  const [kind, setKind] = useState(movement?.kind ?? MOVEMENT_KIND.DEPOSIT);
  const { saving, error, save } = useAccountSave();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const amount = Number(data.get("amount"));
    if (
      await save({
        record: ACCOUNT_RECORD.MOVEMENT,
        id,
        revision,
        input: {
          accountId: account.id,
          kind,
          amount:
            kind === MOVEMENT_KIND.DEPOSIT || kind === MOVEMENT_KIND.CORRECTION
              ? amount
              : -amount,
          at: localDateTimeToIso(data.get("at"), movement?.at),
          notes: data.get("notes"),
        },
      })
    )
      onClose();
  }
  return (
    <form className="layout" onSubmit={(event) => void submit(event)}>
      <fieldset className="account-movement-fields" disabled={saving}>
        <SelectField
          label={m.movementKind}
          value={kind}
          onChange={(event) => {
            const next = Object.values(MOVEMENT_KIND).find(
              (value) => value === event.target.value,
            );
            if (next) setKind(next);
          }}
        >
          {Object.values(MOVEMENT_KIND).map((value) => (
            <option key={value} value={value}>
              {m[value]}
            </option>
          ))}
        </SelectField>
        <label>
          {m.amount} ({account.currency})
          <input
            name="amount"
            type="number"
            step="0.01"
            required
            min={kind === MOVEMENT_KIND.CORRECTION ? undefined : 0.01}
            defaultValue={
              movement &&
              (movement.kind === MOVEMENT_KIND.CORRECTION
                ? movement.amount
                : Math.abs(movement.amount))
            }
          />
        </label>
        <label>
          {m.at}
          <input
            name="at"
            type="datetime-local"
            required
            defaultValue={isoToLocalDateTime(
              movement?.at ?? new Date().toISOString(),
            )}
          />
        </label>
        <label className="wide">
          {t.notes}
          <textarea
            name="notes"
            maxLength={MAX_ACCOUNT_TEXT_LENGTH}
            rows={2}
            defaultValue={movement?.notes}
          />
        </label>
      </fieldset>
      <p className="analytics-hint">{m.amountHint}</p>
      {error && (
        <p role="alert" className="error">
          {m[error]}
        </p>
      )}
      <div className="workspace-actions">
        <button type="submit" disabled={saving}>
          {saving ? t.saving : t.save}
        </button>
        <button
          className="secondary"
          type="button"
          onClick={onClose}
          disabled={saving}
        >
          {t.cancel}
        </button>
      </div>
    </form>
  );
}
