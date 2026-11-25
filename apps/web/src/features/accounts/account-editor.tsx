import {
  ACCOUNT_KIND,
  ACCOUNT_RECORD,
  MAX_ACCOUNT_NAME_LENGTH,
  MAX_ACCOUNT_TEXT_LENGTH,
} from "@liquidation/domain/accounts/constants";
import { TRASH_KIND } from "@liquidation/domain/journal/trash/constants";
import { useState } from "react";
import type { FormEvent } from "react";
import { useLocale } from "../../shared/messages.ts";
import { Panel } from "../../shared/ui/layout.tsx";
import { SelectField } from "../../shared/ui/select-field.tsx";
import { useJournal } from "../journal/data/store.ts";
import {
  AccountRulesFields,
  readAccountRules,
} from "./account-rules-fields.tsx";
import { useAccountMessages } from "./messages.ts";
import type { AccountEditorProps } from "./types.ts";
import { useAccountSave } from "./use-account-save.ts";

export function AccountEditor({
  account,
  initialName,
  onClose,
}: AccountEditorProps) {
  const { t } = useLocale();
  const m = useAccountMessages();
  const [id] = useState(() => account?.id ?? crypto.randomUUID());
  const [revision] = useState(account?.revision);
  const [enabled, setEnabled] = useState(Boolean(account?.rules));
  const currency = useJournal((state) => state.currency);
  const currencyLocked = useJournal(
    (state) =>
      state.accounts.length > 0 ||
      state.trash.some((entry) => entry.kind === TRASH_KIND.ACCOUNT),
  );
  const { saving, error, save } = useAccountSave();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (
      await save({
        record: ACCOUNT_RECORD.ACCOUNT,
        id,
        revision,
        input: {
          name: data.get("name"),
          firm: data.get("firm"),
          kind: data.get("kind"),
          currency: data.get("currency"),
          startingBalance: Number(data.get("startingBalance")),
          archived: account?.archived ?? false,
          notes: data.get("notes"),
          rules: readAccountRules(data),
        },
      })
    )
      onClose();
  }
  return (
    <Panel title={account ? m.editAccount : m.newAccount}>
      <form className="layout" onSubmit={(event) => void submit(event)}>
        <fieldset className="layout" disabled={saving}>
          <div className="record-field-grid">
            <label>
              {m.name}
              <input
                name="name"
                required
                maxLength={MAX_ACCOUNT_NAME_LENGTH}
                defaultValue={account?.name ?? initialName}
              />
            </label>
            <label>
              {m.firm}
              <input name="firm" maxLength={120} defaultValue={account?.firm} />
            </label>
            <SelectField
              name="kind"
              label={m.kind}
              defaultValue={account?.kind ?? ACCOUNT_KIND.BROKER}
              onChange={(event) => {
                if (event.target.value === ACCOUNT_KIND.PROP) setEnabled(true);
              }}
            >
              {Object.values(ACCOUNT_KIND).map((kind) => (
                <option key={kind} value={kind}>
                  {m[kind]}
                </option>
              ))}
            </SelectField>
            <label>
              {m.currency}
              <input
                name="currency"
                maxLength={3}
                pattern="[A-Za-z]{3}"
                required
                defaultValue={account?.currency ?? currency}
                readOnly={currencyLocked}
              />
            </label>
            <label>
              {m.startingBalance}
              <input
                name="startingBalance"
                type="number"
                min={0}
                step="0.01"
                required
                defaultValue={account?.startingBalance ?? 0}
              />
            </label>
            <label className="wide">
              {t.notes}
              <textarea
                name="notes"
                maxLength={MAX_ACCOUNT_TEXT_LENGTH}
                rows={3}
                defaultValue={account?.notes}
              />
            </label>
          </div>
          <p className="analytics-hint">{m.currencyHint}</p>
          <section className="account-rules">
            <label className="workspace-check">
              <input
                name="enableRules"
                type="checkbox"
                checked={enabled}
                onChange={(event) => setEnabled(event.target.checked)}
              />
              {m.enableRules}
            </label>
            {enabled && <AccountRulesFields initial={account?.rules} />}
          </section>
        </fieldset>
        {error && (
          <p className="error" role="alert">
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
    </Panel>
  );
}
