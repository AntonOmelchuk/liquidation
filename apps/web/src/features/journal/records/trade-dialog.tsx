import { TRADE_SIDE } from "@liquidation/domain/trades/constants";
import { tradeInput } from "@liquidation/domain/trades/trade";
import { useState, type FormEvent } from "react";
import { localDateTimeToIso } from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import { InstrumentPicker } from "../../../shared/ui/instrument-picker.tsx";
import { SelectField } from "../../../shared/ui/select-field.tsx";
import { useJournal } from "../data/store.ts";
import { readTradeLinks, TradeLinkFields } from "./trade-link-fields.tsx";
import type { TradeDialogProps } from "./types.ts";

export function TradeDialog({ dialog }: TradeDialogProps) {
  const { t } = useLocale();
  const record = useJournal((state) => state.record);
  const [symbol, setSymbol] = useState("");
  const [openedAt, setOpenedAt] = useState("");
  const [linkDraft, setLinkDraft] = useState(0);
  const [risk, setRisk] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<"invalid" | "saveError" | null>(
    null,
  );

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const result = tradeInput.safeParse({
      symbol: data.get("symbol"),
      direction: data.get("direction"),
      openedAt: localDateTimeToIso(data.get("openedAt")),
      closedAt: localDateTimeToIso(data.get("closedAt")),
      profit: Number(data.get("profit")),
      commission: Number(data.get("commission")),
      swap: Number(data.get("swap")),
      risk: data.get("risk") ? Number(data.get("risk")) : null,
      notes: data.get("notes"),
      ...readTradeLinks(data),
    });

    if (!result.success) {
      setFormError("invalid");
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      await record(result.data);
      form.reset();
      setSymbol("");
      setOpenedAt("");
      setLinkDraft((value) => value + 1);
      setRisk("");
      dialog.current?.close();
    } catch {
      setFormError("saveError");
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby="record-title"
      onCancel={(event) => {
        if (saving) event.preventDefault();
      }}
    >
      <div className="panel-heading">
        <h2 id="record-title">{t.recordTitle}</h2>
        <button
          type="button"
          className="secondary"
          disabled={saving}
          onClick={() => dialog.current?.close()}
        >
          {t.close}
        </button>
      </div>
      {formError && (
        <p className="error" role="alert">
          {t[formError]}
        </p>
      )}
      <form onSubmit={save}>
        <fieldset disabled={saving}>
          <InstrumentPicker value={symbol} onChange={setSymbol} />
          <SelectField
            label={t.side}
            name="direction"
            defaultValue={TRADE_SIDE.LONG}
          >
            <option value={TRADE_SIDE.LONG}>{t.long}</option>
            <option value={TRADE_SIDE.SHORT}>{t.short}</option>
          </SelectField>
          <label>
            {t.opened}
            <input
              type="datetime-local"
              name="openedAt"
              value={openedAt}
              onChange={(event) => setOpenedAt(event.target.value)}
              required
            />
          </label>
          <label>
            {t.closed}
            <input type="datetime-local" name="closedAt" required />
          </label>
          <label>
            {t.gross}
            <input type="number" step="0.01" name="profit" required />
          </label>
          <label>
            {t.commission}
            <input
              type="number"
              step="0.01"
              name="commission"
              defaultValue="0"
            />
          </label>
          <label>
            {t.swap}
            <input type="number" step="0.01" name="swap" defaultValue="0" />
          </label>
          <label>
            {t.risk}
            <input
              type="number"
              step="0.01"
              min="0.01"
              name="risk"
              value={risk}
              onChange={(event) => setRisk(event.target.value)}
            />
          </label>
          <TradeLinkFields
            key={linkDraft}
            openedAt={openedAt}
            risk={risk ? Number(risk) : null}
            closed
          />
          <label className="wide">
            {t.notes}
            <textarea name="notes" rows={3} maxLength={4000} />
          </label>
          <button className="wide" type="submit">
            {saving ? t.saving : t.save}
          </button>
        </fieldset>
      </form>
    </dialog>
  );
}
