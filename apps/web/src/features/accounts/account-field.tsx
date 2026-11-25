import { TRADE_TAG_LIMITS } from "@liquidation/domain/trades/constants";
import { PAGE_HASHES } from "../../app/constants.ts";
import { useLocale } from "../../shared/messages.ts";
import { SelectField } from "../../shared/ui/select-field.tsx";
import { useJournal } from "../journal/data/store.ts";
import { LEGACY_ACCOUNT_OPTION } from "./constants.ts";
import { useAccountMessages } from "./messages.ts";
import type { AccountFieldProps } from "./types.ts";

export function readAccountLink(data: FormData) {
  const selected = data.get("accountId");
  const legacy = selected === null || selected === LEGACY_ACCOUNT_OPTION;
  return {
    accountId: !legacy && selected ? selected : undefined,
    account: legacy
      ? String(data.get("account") ?? "").trim() || undefined
      : undefined,
  };
}

export function AccountField({ initial, onChange }: AccountFieldProps) {
  const { t } = useLocale();
  const m = useAccountMessages();
  const accounts = useJournal((state) => state.accounts);
  const options = accounts.filter(
    (account) => !account.archived || account.id === initial?.accountId,
  );
  const legacy = !initial?.accountId && initial?.account;
  return (
    <div className="account-field">
      {!accounts.length ? (
        <label>
          {t.account}
          <input
            name="account"
            maxLength={TRADE_TAG_LIMITS.account}
            defaultValue={initial?.account}
            placeholder={m.unassigned}
          />
        </label>
      ) : (
        <>
          <SelectField
            label={t.account}
            name="accountId"
            onChange={
              onChange
                ? (event) => onChange(event.currentTarget.value)
                : undefined
            }
            defaultValue={
              initial?.accountId ?? (legacy ? LEGACY_ACCOUNT_OPTION : "")
            }
          >
            <option value="">{m.unassigned}</option>
            {legacy && (
              <option value={LEGACY_ACCOUNT_OPTION}>
                {legacy} · {m.legacy}
              </option>
            )}
            {options.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
                {account.archived ? " · " + m.archived : ""}
              </option>
            ))}
          </SelectField>
          {legacy && <input type="hidden" name="account" value={legacy} />}
        </>
      )}
      {!accounts.length && (
        <a
          className="record-link"
          href={PAGE_HASHES.accounts}
          target="_blank"
          rel="noopener"
        >
          {m.createFirst} ↗
        </a>
      )}
    </div>
  );
}
