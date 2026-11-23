import {
  POSITION_ACTION,
  TRADE_SIDE,
} from "@liquidation/domain/trades/constants";
import { positionCommand } from "@liquidation/domain/trades/position";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { EMPTY_VALUE } from "../../../shared/constants.ts";
import {
  isoToLocalDateTime,
  localDateTimeToIso,
} from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import {
  InstrumentIcons,
  InstrumentPicker,
} from "../../../shared/ui/instrument-picker.tsx";
import { Panel } from "../../../shared/ui/layout.tsx";
import { SelectField } from "../../../shared/ui/select-field.tsx";
import { useJournal } from "../data/store.ts";
import { TradeAssociations } from "./trade-associations.tsx";
import { readTradeLinks, TradeLinkFields } from "./trade-link-fields.tsx";
import type {
  OpenPositionsProps,
  PositionFormAction,
  PositionFormProps,
} from "./types.ts";

function PositionForm({ selection, finish }: PositionFormProps) {
  const { t } = useLocale();
  const update = useJournal((state) => state.updatePosition);
  const position =
    selection.action === POSITION_ACTION.OPEN ? undefined : selection.position;
  const [symbol, setSymbol] = useState(position?.symbol ?? "");
  const originalOpenTime = position
    ? isoToLocalDateTime(position.openedAt)
    : "";
  const [openedAt, setOpenedAt] = useState(originalOpenTime);
  const [risk, setRisk] = useState(position?.risk?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<"invalid" | "positionError" | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!dialog.current?.open) dialog.current?.showModal();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const data = new FormData(event.currentTarget);
    const closing = selection.action === POSITION_ACTION.CLOSE;
    const identity = position
      ? { id: position.id, revision: position.revision }
      : {};
    const result = positionCommand.safeParse({
      action: selection.action,
      ...identity,
      input: closing
        ? {
            closedAt: localDateTimeToIso(data.get("closedAt")),
            profit: Number(data.get("profit")),
            commission: Number(data.get("commission")),
            swap: Number(data.get("swap")),
            links: readTradeLinks(data),
          }
        : {
            symbol: data.get("symbol"),
            direction: data.get("direction"),
            openedAt:
              position && data.get("openedAt") === originalOpenTime
                ? position.openedAt
                : localDateTimeToIso(data.get("openedAt")),
            risk: data.get("risk") ? Number(data.get("risk")) : null,
            notes: data.get("notes"),
            ...readTradeLinks(data),
          },
    });
    if (
      !result.success ||
      (result.data.action === POSITION_ACTION.CLOSE &&
        position &&
        Date.parse(result.data.input.closedAt) < Date.parse(position.openedAt))
    ) {
      setError("invalid");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await update(result.data);
      dialog.current?.close();
    } catch {
      setError("positionError");
      setSaving(false);
    }
  }

  const title =
    selection.action === POSITION_ACTION.OPEN
      ? t.openPosition
      : selection.action === POSITION_ACTION.EDIT
        ? t.editPosition
        : t.closePosition;

  return (
    <dialog
      ref={dialog}
      aria-labelledby="position-title"
      onClose={finish}
      onCancel={(event) => {
        if (saving) event.preventDefault();
      }}
    >
      <div className="panel-heading">
        <h2 id="position-title">{title}</h2>
        <button
          type="button"
          className="secondary"
          disabled={saving}
          onClick={() => dialog.current?.close()}
        >
          {t.close}
        </button>
      </div>
      {selection.action === POSITION_ACTION.CLOSE && (
        <p>
          {selection.position.symbol} · {t[selection.position.direction]}
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {t[error]}
        </p>
      )}
      <form onSubmit={submit}>
        <fieldset disabled={saving}>
          {selection.action === POSITION_ACTION.CLOSE ? (
            <>
              <label>
                {t.closed}
                <input name="closedAt" type="datetime-local" required />
              </label>
              <label>
                {t.gross}
                <input name="profit" type="number" step="0.01" required />
              </label>
              <label>
                {t.commission}
                <input
                  name="commission"
                  type="number"
                  step="0.01"
                  defaultValue={0}
                />
              </label>
              <label>
                {t.swap}
                <input name="swap" type="number" step="0.01" defaultValue={0} />
              </label>
              <TradeLinkFields
                openedAt={openedAt}
                initial={selection.position}
                historic
                closing
              />
            </>
          ) : (
            <>
              <InstrumentPicker value={symbol} onChange={setSymbol} />
              <SelectField
                label={t.side}
                name="direction"
                defaultValue={position?.direction ?? TRADE_SIDE.LONG}
              >
                <option value={TRADE_SIDE.LONG}>{t.long}</option>
                <option value={TRADE_SIDE.SHORT}>{t.short}</option>
              </SelectField>
              <label>
                {t.opened}
                <input
                  name="openedAt"
                  type="datetime-local"
                  value={openedAt}
                  onChange={(event) => setOpenedAt(event.target.value)}
                  required
                />
              </label>
              <label>
                {t.risk}
                <input
                  name="risk"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={risk}
                  onChange={(event) => setRisk(event.target.value)}
                />
              </label>
              <TradeLinkFields
                openedAt={openedAt}
                initial={position}
                risk={risk ? Number(risk) : null}
                editingId={position?.id}
              />
              <label className="wide">
                {t.notes}
                <textarea
                  name="notes"
                  rows={3}
                  maxLength={4000}
                  defaultValue={position?.notes}
                />
              </label>
            </>
          )}
          <button className="wide" type="submit">
            {saving
              ? t.saving
              : selection.action === POSITION_ACTION.CLOSE
                ? t.closePosition
                : t.savePosition}
          </button>
        </fieldset>
      </form>
    </dialog>
  );
}

export function OpenPositions({ ready }: OpenPositionsProps) {
  const { t, format } = useLocale();
  const positions = useJournal((state) => state.positions);
  const [selected, setSelected] = useState<PositionFormAction | null>(null);

  return (
    <Panel
      title={t.openPositions}
      detail={
        <button
          type="button"
          className="secondary"
          disabled={!ready}
          onClick={() => setSelected({ action: POSITION_ACTION.OPEN })}
        >
          {t.openPosition}
        </button>
      }
    >
      {ready &&
        (positions.length ? (
          <div className="table">
            <table aria-label={t.openPositions}>
              <thead>
                <tr>
                  <th>{t.symbol}</th>
                  <th>{t.side}</th>
                  <th>{t.opened}</th>
                  <th>{t.risk}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {positions.map((position) => (
                  <tr key={position.id}>
                    <th scope="row">
                      <span className="instrument-label">
                        <InstrumentIcons symbol={position.symbol} />
                        {position.symbol}
                      </span>
                      <TradeAssociations {...position} />
                      {position.notes && <small>{position.notes}</small>}
                    </th>
                    <td>{t[position.direction]}</td>
                    <td>{format.date.format(new Date(position.openedAt))}</td>
                    <td>
                      {position.risk === null
                        ? EMPTY_VALUE
                        : format.money.format(position.risk)}
                    </td>
                    <td>
                      <div className="position-actions">
                        <button
                          type="button"
                          className="secondary"
                          onClick={() =>
                            setSelected({
                              action: POSITION_ACTION.EDIT,
                              position,
                            })
                          }
                        >
                          {t.editPosition}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setSelected({
                              action: POSITION_ACTION.CLOSE,
                              position,
                            })
                          }
                        >
                          {t.closePosition}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>{t.noOpenPositions}</p>
        ))}
      {selected && (
        <PositionForm selection={selected} finish={() => setSelected(null)} />
      )}
    </Panel>
  );
}
