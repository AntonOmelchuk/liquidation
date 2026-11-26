import { entryRiskSizing } from "@liquidation/domain/accounts/entry-risk";
import {
  calculatedGrossProfit,
  riskFromSizing,
} from "@liquidation/domain/trades/financials";
import type { TradeDirection } from "@liquidation/domain/trades/types";
import {
  TRADE_SIDE,
  POSITION_ACTION,
} from "@liquidation/domain/trades/constants";
import { positionCommand } from "@liquidation/domain/trades/position";
import { tradeRecordInput } from "@liquidation/domain/trades/trade";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { PAGE_HASHES } from "../../../app/constants.ts";
import {
  isoToLocalDateTime,
  localDateTimeToIso,
} from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import { TradeSideBadge } from "../../../shared/ui/direction-badge.tsx";
import {
  InstrumentPicker,
  InstrumentIcons,
} from "../../../shared/ui/instrument-picker.tsx";
import { Panel, RecordActions } from "../../../shared/ui/layout.tsx";
import { SelectField } from "../../../shared/ui/select-field.tsx";
import { AccountField } from "../../accounts/account-field.tsx";
import { useAccountSource } from "../../accounts/use-account-source.ts";
import { MistakeReviewFields } from "../../mistakes/review-fields.tsx";
import { JOURNAL_STATUS } from "../data/constants.ts";
import { useJournal } from "../data/store.ts";
import { JournalUnavailable } from "../journal-unavailable.tsx";
import { TRADE_EDITOR_MODE } from "./constants.ts";
import {
  readPnlCalculation,
  TradeOutcomeFields,
  TradeRiskFields,
} from "./trade-financial-fields.tsx";
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
  const [openedAt, setOpenedAt] = useState(() =>
    mode === POSITION_ACTION.OPEN
      ? isoToLocalDateTime(new Date().toISOString())
      : initial
        ? isoToLocalDateTime(initial.openedAt)
        : "",
  );
  const [riskText, setRiskText] = useState(
    initial?.riskSizing?.percent.toString() ?? "",
  );
  const [accountId, setAccountId] = useState(initial?.accountId ?? "");
  const [direction, setDirection] = useState<TradeDirection>(
    initial?.direction ?? TRADE_SIDE.LONG,
  );
  const accounts = useJournal((state) => state.accounts);
  const currency = useJournal((state) => state.currency);
  const source = useAccountSource();
  const account = accounts.find((item) => item.id === accountId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const heading = useRef<HTMLHeadingElement>(null);
  const { draft, setDraft } = useTradeEvidence(initial);
  const closing = mode === POSITION_ACTION.CLOSE;
  const recording = mode === TRADE_EDITOR_MODE.RECORD;
  const closed = closing || recording;
  const entryAt = localDateTimeToIso(openedAt, initial?.openedAt);
  const riskPercent = riskText
    ? Number(riskText)
    : initial?.riskSizing
      ? null
      : undefined;
  const sizing = useMemo(
    () =>
      account && riskPercent != null && !closing
        ? entryRiskSizing(account, source, entryAt, riskPercent, initial)
        : null,
    [account, source, entryAt, riskPercent, initial, closing],
  );
  const risk =
    closing || riskPercent === undefined
      ? (initial?.risk ?? null)
      : sizing
        ? riskFromSizing(sizing)
        : null;
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
    if (!closing && riskPercent != null && risk === null) {
      setError(m.riskInvalid);
      return;
    }
    const pnlCalculation = readPnlCalculation(data);
    const profit = pnlCalculation
      ? calculatedGrossProfit(risk, pnlCalculation, direction, links.prices)
      : Number(data.get("profit"));
    if (closed && profit === null) {
      setError(m.pnlInvalid);
      return;
    }
    const opening = {
      symbol: data.get("symbol"),
      direction,
      openedAt: entryAt,
      risk,
      riskPercent,
      notes: data.get("notes"),
    };
    const outcome = {
      closedAt: localDateTimeToIso(data.get("closedAt")),
      profit,
      commission: Number(data.get("commission")),
      swap: Number(data.get("swap")),
      pnlCalculation,
    };
    setSaving(true);
    setError(undefined);
    try {
      if (recording) {
        const result = tradeRecordInput.safeParse({
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
              <TradeSideBadge side={initial.direction} />
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
                value={direction}
                onChange={(event) =>
                  setDirection(
                    event.currentTarget.value === TRADE_SIDE.SHORT
                      ? TRADE_SIDE.SHORT
                      : TRADE_SIDE.LONG,
                  )
                }
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
              <AccountField initial={initial} onChange={setAccountId} />
              <TradeRiskFields
                value={riskText}
                onChange={setRiskText}
                hasAccount={Boolean(account)}
                sizing={sizing}
                risk={risk}
                currency={currency}
              />
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
              <TradeOutcomeFields
                initial={initial}
                direction={direction}
                risk={risk}
                currency={currency}
                automatic={Boolean(closing ? initial?.riskSizing : sizing)}
              />
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
              risk={risk}
              showAccount={closing}
              showPrices={!closed}
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
