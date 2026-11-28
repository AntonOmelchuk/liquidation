import { DateText } from "../../../shared/ui/date-text.tsx";
import { ICON_ACTION } from "../../../shared/ui/constants.ts";
import { IconAction } from "../../../shared/ui/icon-action.tsx";
import { fromCents } from "@liquidation/domain/shared/money";
import { priceMetrics } from "@liquidation/domain/analytics/trade-risk";
import { HOURS_IN_MS } from "@liquidation/domain/analytics/constants";
import { TRASH_KIND } from "@liquidation/domain/journal/trash/constants";
import { POSITION_ACTION } from "@liquidation/domain/trades/constants";
import { positionInput } from "@liquidation/domain/trades/position";
import { netCents, realizedR } from "@liquidation/domain/trades/trade";
import { useEffect, useId, useRef, useState } from "react";
import { PAGE_VIEW } from "../../../app/constants.ts";
import { positionEditHref, tradeLinksHref } from "../../../app/page.ts";
import { EMPTY_VALUE } from "../../../shared/constants.ts";
import { numericTone } from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import { TradeSideBadge } from "../../../shared/ui/direction-badge.tsx";
import { InstrumentIcons } from "../../../shared/ui/instrument-picker.tsx";
import { Panel } from "../../../shared/ui/layout.tsx";
import { useAccountMessages } from "../../accounts/messages.ts";
import { useAdvancedStatisticsMessages } from "../../statistics/advanced-messages.ts";
import { DeleteRecord } from "../../trash/delete-record.tsx";
import { useJournal } from "../data/store.ts";
import { PRICE_FIELD_LABEL, TRADE_PRICE_FIELDS } from "./constants.ts";
import { useTradeRecordMessages } from "./messages.ts";
import { useMistakeMessages } from "../../mistakes/messages.ts";
import { TradeEvidenceGallery } from "./trade-evidence-fields.tsx";
import { TradeAssociations } from "./trade-associations.tsx";
import type { TradeDetailsDialogProps } from "./types.ts";

export function TradeDetailsDialog({
  record,
  onClose,
}: TradeDetailsDialogProps) {
  const { t, format } = useLocale();
  const m = useTradeRecordMessages();
  const mistake = useMistakeMessages();
  const a = useAccountMessages();
  const s = useAdvancedStatisticsMessages();
  const currency = useJournal((state) => state.currency);
  const update = useJournal((state) => state.updatePosition);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [saving, setSaving] = useState(false);
  const [riskError, setRiskError] = useState(false);
  const trade = "closedAt" in record ? record : undefined;
  const initialRisk = record.risk;
  const cash = (value: number | null) =>
    value === null ? EMPTY_VALUE : format.money.format(value) + " " + currency;
  const r = (value: number | null) =>
    value === null ? EMPTY_VALUE : format.money.format(value) + " R";
  const metrics = trade ? priceMetrics(trade) : undefined;
  const prices = TRADE_PRICE_FIELDS.flatMap((key) =>
    record.prices?.[key] === undefined
      ? []
      : [{ key, label: a[PRICE_FIELD_LABEL[key]], value: record.prices[key]! }],
  );

  useEffect(() => {
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
  }, []);
  async function changeRisk() {
    if (saving || "closedAt" in record) return;
    setSaving(true);
    setRiskError(false);
    try {
      await update({
        action: POSITION_ACTION.EDIT,
        id: record.id,
        revision: record.revision,
        input: positionInput.parse({ ...record, breakeven: !record.breakeven }),
      });
    } catch {
      setRiskError(true);
    } finally {
      setSaving(false);
    }
  }
  return (
    <dialog
      className="trade-details-dialog"
      ref={dialog}
      aria-labelledby={titleId}
      onClose={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onCancel={(event) => {
        if (saving) event.preventDefault();
      }}
    >
      <header className="trade-detail-header">
        <div>
          <span className="subdued">
            {trade ? m.details : m.positionDetails}
          </span>
          <h2 id={titleId} className="instrument-label">
            <InstrumentIcons symbol={record.symbol} />
            {record.symbol} <TradeSideBadge side={record.direction} />
          </h2>
        </div>
        <button
          type="button"
          className="secondary"
          disabled={saving}
          onClick={() => dialog.current?.close()}
        >
          {t.close}
        </button>
      </header>
      <div className="layout trade-details-content">
        <Panel title={m.financial}>
          <dl className="trade-detail-facts">
            {trade && (
              <>
                <div>
                  <dt>{t.pnl}</dt>
                  <dd className={numericTone(netCents(trade))}>
                    {cash(netCents(trade) / 100)}
                  </dd>
                </div>
                <div>
                  <dt>{t.result}</dt>
                  <dd className={numericTone(realizedR(trade) ?? 0)}>
                    {r(realizedR(trade))}
                  </dd>
                </div>
                <div>
                  <dt>{t.gross}</dt>
                  <dd>{cash(trade.profit)}</dd>
                </div>
                <div>
                  <dt>{t.commission}</dt>
                  <dd>{cash(trade.commission)}</dd>
                </div>
                <div>
                  <dt>{t.swap}</dt>
                  <dd>{cash(trade.swap)}</dd>
                </div>
              </>
            )}
            <div>
              <dt>{m.initialRisk}</dt>
              <dd>
                {record.riskSizing &&
                  format.riskPercent.format(record.riskSizing.percent / 100) +
                    " · "}
                {cash(initialRisk)}
              </dd>
            </div>
            {record.riskSizing && (
              <div>
                <dt>{m.entryBalance}</dt>
                <dd>{cash(fromCents(record.riskSizing.balanceCents))}</dd>
              </div>
            )}
            {!trade && (
              <div>
                <dt>{m.atRisk}</dt>
                <dd>{cash(record.breakeven ? 0 : initialRisk)}</dd>
              </div>
            )}
            {record.breakeven && (
              <div>
                <dt>{m.stopStatus}</dt>
                <dd className="positive">{a.breakeven}</dd>
              </div>
            )}
            <div>
              <dt>{t.opened}</dt>
              <dd>
                <DateText value={record.openedAt} withTime />
              </dd>
            </div>
            {trade && (
              <>
                <div>
                  <dt>{t.closed}</dt>
                  <dd>
                    <DateText value={trade.closedAt} withTime />
                  </dd>
                </div>
                <div>
                  <dt>{m.duration}</dt>
                  <dd>
                    {format.money.format(
                      (Date.parse(trade.closedAt) -
                        Date.parse(trade.openedAt)) /
                        HOURS_IN_MS,
                    )}{" "}
                    {m.hours}
                  </dd>
                </div>
              </>
            )}
          </dl>
        </Panel>
        <Panel title={m.context}>
          <TradeAssociations {...record} />
        </Panel>
        {prices.length > 0 && (
          <Panel title={m.prices}>
            <dl className="trade-detail-facts">
              {prices.map(({ key, label, value }) => (
                <div key={key}>
                  <dt>{label}</dt>
                  <dd>{format.price.format(value)}</dd>
                </div>
              ))}
              {metrics && (
                <>
                  <div>
                    <dt>{s.plannedRR}</dt>
                    <dd>{r(metrics.plannedRR)}</dd>
                  </div>
                  <div>
                    <dt>{s.grossR}</dt>
                    <dd>{r(metrics.grossR)}</dd>
                  </div>
                  <div>
                    <dt>MFE</dt>
                    <dd>{r(metrics.mfe)}</dd>
                  </div>
                  <div>
                    <dt>MAE</dt>
                    <dd>{r(metrics.mae)}</dd>
                  </div>
                  <div>
                    <dt>{s.givebackR}</dt>
                    <dd>{r(metrics.givebackR)}</dd>
                  </div>
                </>
              )}
            </dl>
          </Panel>
        )}
        <TradeEvidenceGallery record={record} />
        {record.reviewNotes && (
          <Panel title={mistake.reviewNotes}>
            <p className="record-prose">{record.reviewNotes}</p>
          </Panel>
        )}
        <Panel title={t.notes}>
          <p className="record-prose">{record.notes || m.noteEmpty}</p>
        </Panel>
      </div>
      {riskError && (
        <p className="error" role="alert">
          {m.riskChangeError}
        </p>
      )}
      <footer className="trade-detail-footer workspace-actions">
        {"closedAt" in record ? (
          <IconAction
            icon={ICON_ACTION.EDIT}
            label={mistake.reviewTrade}
            href={tradeLinksHref(record.id)}
            onClick={onClose}
          />
        ) : (
          <>
            <button
              type="button"
              className="secondary"
              disabled={saving}
              onClick={() => void changeRisk()}
            >
              {record.breakeven ? a.restoreRisk : a.moveToBe}
            </button>
            <IconAction
              icon={ICON_ACTION.EDIT}
              label={t.editPosition}
              href={positionEditHref(record.id, PAGE_VIEW.EDIT)}
              onClick={onClose}
            />
            <a
              className="action-link"
              href={positionEditHref(record.id, PAGE_VIEW.CLOSE)}
              onClick={onClose}
            >
              {t.closePosition}
            </a>
          </>
        )}
        <DeleteRecord
          kind={"closedAt" in record ? TRASH_KIND.TRADE : TRASH_KIND.POSITION}
          recordKey={record.id}
          revision={"revision" in record ? record.revision : undefined}
          disabled={saving}
          afterDelete={onClose}
        />
      </footer>
    </dialog>
  );
}
