import { entryTestKey } from "@liquidation/domain/trades/trade-tags";
import {
  ENTRY_TEST,
  ENTRY_TYPE,
  TRADE_SESSION,
  TRADE_TAG_LIMITS,
} from "@liquidation/domain/trades/constants";
import { useId } from "react";
import type { TradeTagFieldsProps } from "./types.ts";

import { useLocale } from "../../../shared/messages.ts";
import { SelectField } from "../../../shared/ui/select-field.tsx";
import { useJournal } from "../data/store.ts";
import { FIELD_HAS_LIMIT_TEST } from "./constants.ts";
import { useTradeRecordMessages } from "./messages.ts";

export function readTradeTags(data: FormData) {
  const test = data.get(FIELD_HAS_LIMIT_TEST);
  const mistakes = data.getAll("mistakes").map(String);
  const criticalMistakes = data.getAll("criticalMistakes").map(String);
  return {
    style: String(data.get("style") ?? "").trim() || undefined,
    session: data.get("session") || undefined,
    entryType: data.get("entryType") || undefined,
    limitEntryTest:
      test === ENTRY_TEST.RETESTED
        ? true
        : test === ENTRY_TEST.MARKET_ONLY
          ? false
          : undefined,
    mistakes: mistakes.length ? mistakes : undefined,
    criticalMistakes: criticalMistakes.length ? criticalMistakes : undefined,
    mistakesReviewed:
      mistakes.length || data.has("mistakesReviewed") ? true : undefined,
    reviewNotes: String(data.get("reviewNotes") ?? "").trim() || undefined,
  };
}

export function TradeTagFields({ initial }: TradeTagFieldsProps) {
  const { t } = useLocale();
  const hint = useId();
  const m = useTradeRecordMessages();
  const trades = useJournal((state) => state.trades);
  const positions = useJournal((state) => state.positions);
  const styles = [
    ...new Set(
      [...(trades ?? []), ...positions].flatMap((record) =>
        record.style ? [record.style] : [],
      ),
    ),
  ].sort();
  return (
    <>
      <SelectField
        label={m.entryTest}
        name={FIELD_HAS_LIMIT_TEST}
        defaultValue={entryTestKey(initial?.limitEntryTest)}
        title={m.entryTestHelp}
        aria-describedby={hint + "-test"}
      >
        <option value="">{m.entryTestUnknown}</option>
        <option value={ENTRY_TEST.RETESTED}>{m.entryTestYes}</option>
        <option value={ENTRY_TEST.MARKET_ONLY}>{m.entryTestNo}</option>
      </SelectField>
      <p id={hint + "-test"} className="wide subdued trade-test-help">
        {m.entryTestHelp}
      </p>
      <details className="trade-tags wide">
        <summary>{t.tradeTags}</summary>
        <div className="trade-tag-fields">
          <label>
            {t.style}
            <input
              name="style"
              list={hint + "-styles"}
              maxLength={TRADE_TAG_LIMITS.style}
              defaultValue={initial?.style}
            />
          </label>
          <datalist id={hint + "-styles"}>
            {styles.map((style) => (
              <option key={style} value={style} />
            ))}
          </datalist>
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
        </div>
      </details>
    </>
  );
}
