import {
  TRADE_SIDE,
  POSITION_ACTION,
} from "@liquidation/domain/trades/constants";
import { positionCommand } from "@liquidation/domain/trades/position";
import { tradeInput } from "@liquidation/domain/trades/trade";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { PAGE_HASHES } from "../../../app/constants.ts";
import {
  isoToLocalDateTime,
  localDateTimeToIso,
} from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import {
  InstrumentPicker,
  InstrumentIcons,
} from "../../../shared/ui/instrument-picker.tsx";
import { Panel, RecordActions } from "../../../shared/ui/layout.tsx";
import { SelectField } from "../../../shared/ui/select-field.tsx";
import { MistakeReviewFields } from "../../mistakes/review-fields.tsx";
import { JOURNAL_STATUS } from "../data/constants.ts";
import { useJournal } from "../data/store.ts";
import { JournalUnavailable } from "../journal-unavailable.tsx";
import { TRADE_EDITOR_MODE } from "./constants.ts";
import { useTradeRecordMessages } from "./messages.ts";
import { readTradeLinks, TradeLinkFields } from "./trade-link-fields.tsx";
import {
  readTradeEvidence,
  TradeEvidenceFields,
  tradeEvidenceUploads,
  useTradeEvidence,
} from "./trade-evidence-fields.tsx";
import type { TradeEditorPageProps, TradeEditorProps } from "./types.ts";

export function TradeEditorPage({ mode, id }: TradeEditorPageProps) {
  const { t } = useLocale();
  const status = useJournal((state) => state.status);
  const position = useJournal((state) =>
    state.positions.find((record) => record.id === id),
  );
  if (status !== JOURNAL_STATUS.READY || (id && !position)) {
    return (
      <JournalUnavailable
        backHref={PAGE_HASHES.journal}
        backLabel={t.backJournal}
        missing={t.noTrade}
      />
    );
  }
  return (
    <TradeEditor
      key={mode + "/" + (id ?? "")}
      mode={mode}
      position={position}
    />
  );
}

function TradeEditor({ mode, position }: TradeEditorProps) {
  const { t, format } = useLocale();
  const m = useTradeRecordMessages();
  const record = useJournal((state) => state.record);
  const update = useJournal((state) => state.updatePosition);
  const [initial] = useState(() => position);
  const [symbol, setSymbol] = useState(initial?.symbol ?? "");
  const originalOpenTime = initial ? isoToLocalDateTime(initial.openedAt) : "";
  const [openedAt, setOpenedAt] = useState(originalOpenTime);
  const [risk, setRisk] = useState(initial?.risk?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const heading = useRef<HTMLHeadingElement>(null);
  const { draft, setDraft } = useTradeEvidence(initial);
  const closing = mode === POSITION_ACTION.CLOSE;
  const recording = mode === TRADE_EDITOR_MODE.RECORD;
  const closed = closing || recording;
  const title = recording
    ? t.recordTitle
    : closing
      ? t.closePosition
      : mode === POSITION_ACTION.EDIT
        ? t.editPosition
        : t.openPosition;

  useEffect(() => {
    window.scrollTo(0, 0);
    heading.current?.focus({ preventScroll: true });
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const data = new FormData(event.currentTarget);
    const uploads = tradeEvidenceUploads(draft);
    if (!uploads) {
      setError(m.screenshotLimit);
      return;
    }
    const links = { ...readTradeLinks(data), ...readTradeEvidence(draft) };
    const opening = {
      symbol: data.get("symbol"),
      direction: data.get("direction"),
      openedAt:
        initial && openedAt === originalOpenTime
          ? initial.openedAt
          : localDateTimeToIso(data.get("openedAt")),
      risk: risk ? Number(risk) : null,
      notes: data.get("notes"),
    };
    const outcome = {
      closedAt: localDateTimeToIso(data.get("closedAt")),
      profit: Number(data.get("profit")),
      commission: Number(data.get("commission")),
      swap: Number(data.get("swap")),
    };
    setSaving(true);
    setError(undefined);
    try {
      if (recording) {
        const result = tradeInput.safeParse({
          ...opening,
          ...outcome,
          ...links,
        });
        if (!result.success) {
          setError(t.invalid);
          return;
        }
        await record(result.data, uploads);
      } else {
        const result = positionCommand.safeParse({
          action: mode,
          id: initial?.id,
          revision: initial?.revision,
          input: closing ? { ...outcome, links } : { ...opening, ...links },
        });
        if (
          !result.success ||
          (closing &&
            initial &&
            Date.parse(outcome.closedAt) < Date.parse(initial.openedAt))
        ) {
          setError(t.invalid);
          return;
        }
        await update(result.data, uploads);
      }
      window.location.replace(PAGE_HASHES.journal);
    } catch {
      setError(recording ? t.saveError : t.positionError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="record-editor trade-editor">
      <a className="record-back" href={PAGE_HASHES.journal}>
        ← {t.backJournal}
      </a>
      <header className="page-heading plan-detail-heading">
        <div>
          <h1 ref={heading} tabIndex={-1}>
            {title}
          </h1>
          {initial && (
            <div className="plan-detail-meta">
              <span className="instrument-label">
                <InstrumentIcons symbol={initial.symbol} />
                {initial.symbol}
              </span>
              <span>{t[initial.direction]}</span>
              <time dateTime={initial.openedAt}>
                {format.date.format(Date.parse(initial.openedAt))}
              </time>
            </div>
          )}
        </div>
      </header>
      <form onSubmit={save} className="layout">
        {!closing && (
          <Panel title={m.financialFields}>
            <fieldset disabled={saving}>
              <InstrumentPicker value={symbol} onChange={setSymbol} />
              <SelectField
                label={t.side}
                name="direction"
                defaultValue={initial?.direction ?? TRADE_SIDE.LONG}
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
                  onChange={(event) => setOpenedAt(event.currentTarget.value)}
                  required
                />
              </label>
              <label>
                {m.initialRisk}
                <input
                  type="number"
                  name="risk"
                  min="0.01"
                  step="0.01"
                  value={risk}
                  onChange={(event) => setRisk(event.currentTarget.value)}
                />
              </label>
              <label className="wide">
                {t.notes}
                <textarea
                  name="notes"
                  rows={4}
                  maxLength={4000}
                  defaultValue={initial?.notes}
                />
              </label>
            </fieldset>
          </Panel>
        )}
        {closed && (
          <Panel title={m.closeFields}>
            <fieldset disabled={saving}>
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
                  defaultValue={0}
                />
              </label>
              <label>
                {t.swap}
                <input type="number" step="0.01" name="swap" defaultValue={0} />
              </label>
            </fieldset>
          </Panel>
        )}
        <Panel title={m.positionContext}>
          <fieldset disabled={saving}>
            <TradeLinkFields
              openedAt={openedAt}
              initial={initial}
              historic={closing}
              closed={recording}
              closing={closing}
              risk={risk ? Number(risk) : null}
              editingId={initial?.id}
            />
          </fieldset>
        </Panel>
        <TradeEvidenceFields
          draft={draft}
          onChange={setDraft}
          closed={closed}
          disabled={saving}
        />
        <MistakeReviewFields initial={initial} disabled={saving} />
        <RecordActions
          backHref={PAGE_HASHES.journal}
          cancel={t.cancel}
          submit={
            saving
              ? t.saving
              : closing
                ? t.closePosition
                : recording
                  ? t.save
                  : t.savePosition
          }
          saving={saving}
          error={error}
        />
      </form>
    </main>
  );
}
