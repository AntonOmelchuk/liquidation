import {
  ENTRY_TYPE,
  TRADE_SESSION,
  TRADE_TAG_LIMITS,
} from "@liquidation/domain/trades/constants";
import { useId } from "react";
import type { TradeTagFieldsProps } from "./types.ts";

import { useLocale } from "../../../shared/messages.ts";
import { SelectField } from "../../../shared/ui/select-field.tsx";

function mistakeLabels(value: string) {
  return value
    .split(/\r?\n/)
    .map((label) => label.trim())
    .filter(Boolean);
}

export function readTradeTags(data: FormData) {
  const mistakes = mistakeLabels(String(data.get("mistakes") ?? ""));
  return {
    account: String(data.get("account") ?? "").trim() || undefined,
    session: data.get("session") || undefined,
    entryType: data.get("entryType") || undefined,
    mistakes: mistakes.length ? mistakes : undefined,
  };
}

export function TradeTagFields({ initial }: TradeTagFieldsProps) {
  const { t } = useLocale();
  const hint = useId();
  return (
    <details className="trade-tags wide">
      <summary>{t.tradeTags}</summary>
      <div className="trade-tag-fields">
        <label>
          {t.account}
          <input
            name="account"
            maxLength={TRADE_TAG_LIMITS.account}
            defaultValue={initial?.account}
          />
        </label>
        <SelectField
          label={t.session}
          name="session"
          defaultValue={initial?.session ?? ""}
        >
          <option value="">{t.unspecified}</option>
          {Object.values(TRADE_SESSION).map((session) => (
            <option key={session} value={session}>
              {session === TRADE_SESSION.OUTSIDE ? t.outsideSession : session}
            </option>
          ))}
        </SelectField>
        <SelectField
          label={t.entryType}
          name="entryType"
          defaultValue={initial?.entryType ?? ""}
        >
          <option value="">{t.unspecified}</option>
          {Object.values(ENTRY_TYPE).map((type) => (
            <option key={type} value={type}>
              {t[type]}
            </option>
          ))}
        </SelectField>
        <label className="wide">
          {t.mistakes}
          <textarea
            rows={3}
            name="mistakes"
            maxLength={
              TRADE_TAG_LIMITS.mistakes * (TRADE_TAG_LIMITS.mistake + 1)
            }
            defaultValue={initial?.mistakes?.join("\n")}
            aria-describedby={hint}
            onInput={(event) => {
              const field = event.currentTarget;
              const tags = mistakeLabels(field.value);
              const valid =
                tags.length <= TRADE_TAG_LIMITS.mistakes &&
                tags.every((tag) => tag.length <= TRADE_TAG_LIMITS.mistake);
              field.setCustomValidity(valid ? "" : t.invalidMistakes);
            }}
            onInvalid={(event) => {
              // Expand the disclosure so the browser can focus the invalid field.
              const details = event.currentTarget.closest("details");
              if (details) details.open = true;
            }}
          />
          <small id={hint}>
            {t.mistakeInstructions} · ≤ {TRADE_TAG_LIMITS.mistakes} ×{" "}
            {TRADE_TAG_LIMITS.mistake}
          </small>
        </label>
      </div>
    </details>
  );
}
