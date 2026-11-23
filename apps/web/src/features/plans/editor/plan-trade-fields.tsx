import type { Position, Trade } from "@liquidation/domain/trades/types";
import { useMemo, useState } from "react";
import { PLAN_LINKS_PAGE_SIZE } from "./constants.ts";
import type { PlanTradeFieldsProps } from "./types.ts";

import { netCents } from "@liquidation/domain/trades/trade";
import { EMPTY_VALUE } from "../../../shared/constants.ts";
import { numericTone } from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import { InstrumentIcons } from "../../../shared/ui/instrument-picker.tsx";
import { useJournal } from "../../journal/data/store.ts";
import { usePlanMessages } from "../messages.ts";

export function PlanTradeFields({
  planId,
  changes,
  onChange,
}: PlanTradeFieldsProps) {
  const p = usePlanMessages();
  const { t, format } = useLocale();
  const trades = useJournal((state) => state.trades);
  const positions = useJournal((state) => state.positions);
  const plans = useJournal((state) => state.plans);
  const [query, setQuery] = useState("");
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [limit, setLimit] = useState(PLAN_LINKS_PAGE_SIZE);
  const records = useMemo(
    () =>
      [...positions, ...(trades ?? [])].sort(
        (a, b) => Date.parse(b.openedAt) - Date.parse(a.openedAt),
      ),
    [positions, trades],
  );
  const names = useMemo(
    () => new Map(plans.map(({ id, setup }) => [id, setup.title])),
    [plans],
  );
  const selected = (record: Trade | Position) =>
    changes.get(record.id)?.attached ?? record.planId === planId;
  const term = query.trim().toLowerCase();
  const visible = records.filter(
    (record) =>
      (!selectedOnly || selected(record)) &&
      [record.symbol, record.openedAt, record.notes].some((value) =>
        value.toLowerCase().includes(term),
      ),
  );
  const count = records.filter(selected).length;

  if (!records.length) return <p>{p.noJournalTrades}</p>;

  return (
    <>
      <div className="journal-filters plan-trade-filters">
        <label>
          {p.searchTrades}
          <input
            type="search"
            placeholder="EURUSD"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setLimit(PLAN_LINKS_PAGE_SIZE);
            }}
          />
        </label>
        <label className="plan-trade-checkbox">
          <input
            type="checkbox"
            checked={selectedOnly}
            onChange={(event) => {
              setSelectedOnly(event.target.checked);
              setLimit(PLAN_LINKS_PAGE_SIZE);
            }}
          />
          {p.selectedTradesOnly}
        </label>
      </div>
      <p className="plan-field-hint" aria-live="polite">
        {p.selectedTrades} · {format.integer.format(count)}
      </p>
      {visible.length > 0 ? (
        <div className="table plan-trade-options">
          <table aria-label={p.linked}>
            <thead>
              <tr>
                <th scope="col">{p.includeTrade}</th>
                <th scope="col">{t.symbol}</th>
                <th scope="col">{p.entryDate}</th>
                <th scope="col">{p.tradeState}</th>
                <th scope="col">{t.linkedPlan}</th>
                <th scope="col">{p.realizedPnl}</th>
              </tr>
            </thead>
            <tbody>
              {visible.slice(0, limit).map((record) => {
                const checked = selected(record);
                const closed = "closedAt" in record;
                const opened = format.date.format(Date.parse(record.openedAt));
                const previousPlan = record.planId && names.get(record.planId);
                const pnl = closed ? netCents(record) / 100 : null;
                return (
                  <tr key={record.id}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`${p.includeTrade} · ${record.symbol} · ${t[record.direction]} · ${opened}`}
                        checked={checked}
                        onChange={(event) =>
                          onChange({
                            id: record.id,
                            previousPlanId: record.planId ?? null,
                            attached: event.target.checked,
                          })
                        }
                      />
                    </td>
                    <th scope="row">
                      <span className="instrument-label">
                        <InstrumentIcons symbol={record.symbol} />
                        {record.symbol}
                      </span>
                      <small>{t[record.direction]}</small>
                    </th>
                    <td>
                      <time dateTime={record.openedAt}>{opened}</time>
                    </td>
                    <td>{closed ? p.closedState : p.openState}</td>
                    <td>
                      {record.planId === planId
                        ? p.thisPlan
                        : previousPlan || EMPTY_VALUE}
                    </td>
                    <td className={numericTone(pnl ?? 0)}>
                      {pnl === null ? EMPTY_VALUE : format.money.format(pnl)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p>{p.noTradeMatches}</p>
      )}
      {visible.length > limit && (
        <button
          type="button"
          className="secondary"
          onClick={() => setLimit(limit + PLAN_LINKS_PAGE_SIZE)}
        >
          {p.moreTrades}
        </button>
      )}
      <p className="plan-field-hint">{p.tradeLinkHint}</p>
    </>
  );
}
