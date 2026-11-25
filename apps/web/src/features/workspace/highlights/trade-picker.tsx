import { newestTrades } from "@liquidation/domain/workspace/analytics";
import { useMemo, useState } from "react";
import { useLocale } from "../../../shared/messages.ts";
import { Panel } from "../../../shared/ui/layout.tsx";
import { useWorkspaceMessages } from "../messages.ts";
import { SubjectResult } from "../reports/assessment-fields.tsx";
import { TRADE_PICKER_PAGE_SIZE } from "./constants.ts";
import type { TradePickerProps } from "./types.ts";

export function TradePicker({ trades, onSelect, onCancel }: TradePickerProps) {
  const { t, format } = useLocale();
  const m = useWorkspaceMessages();
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(TRADE_PICKER_PAGE_SIZE);
  const sorted = useMemo(() => newestTrades(trades), [trades]);
  const query = search.trim().toLowerCase();
  const matching = sorted.filter((trade) =>
    [
      trade.symbol,
      trade.closedAt,
      trade.notes,
      format.date.format(Date.parse(trade.closedAt)),
    ].some((part) => part.toLowerCase().includes(query)),
  );

  return (
    <Panel
      title={m.addFromJournal}
      detail={
        <button type="button" className="secondary" onClick={onCancel}>
          {t.cancel}
        </button>
      }
    >
      <div className="journal-filters">
        <label>
          {m.findJournalTrade}
          <input
            type="search"
            value={search}
            autoFocus
            onChange={(event) => {
              setSearch(event.target.value);
              setLimit(TRADE_PICKER_PAGE_SIZE);
            }}
          />
        </label>
      </div>
      {matching.length === 0 ? (
        <p>{t.noMatches}</p>
      ) : (
        <div className="table">
          <table aria-label={m.addFromJournal}>
            <thead>
              <tr>
                <th scope="col">{t.symbol}</th>
                <th scope="col">{t.closed}</th>
                <th scope="col">{t.result}</th>
                <th scope="col">{m.exampleSource}</th>
              </tr>
            </thead>
            <tbody>
              {matching.slice(0, limit).map((trade) => (
                <tr key={trade.id}>
                  <th scope="row">
                    {trade.symbol} · {t[trade.direction]}
                  </th>
                  <td>{format.date.format(Date.parse(trade.closedAt))}</td>
                  <td>
                    <SubjectResult subject={trade} />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => onSelect(trade.id)}
                    >
                      {m.selectTrade}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {matching.length > limit && (
        <button
          className="secondary"
          type="button"
          onClick={() => setLimit((size) => size + TRADE_PICKER_PAGE_SIZE)}
        >
          {m.moreTrades}
        </button>
      )}
    </Panel>
  );
}
