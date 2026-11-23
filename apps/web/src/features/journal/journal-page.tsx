import { TRADE_SIDE } from "@liquidation/domain/trades/constants";
import { summarize } from "@liquidation/domain/trades/trade";
import { useDeferredValue, useMemo, useRef, useState } from "react";
import { EMPTY_VALUE, FILTER_ALL } from "../../shared/constants.ts";
import { useLocale } from "../../shared/messages.ts";
import { Metric, Panel } from "../../shared/ui/layout.tsx";
import { SelectField } from "../../shared/ui/select-field.tsx";
import { JOURNAL_STATUS } from "./data/constants.ts";
import { useJournal } from "./data/store.ts";
import { filterTrades } from "./filters.ts";
import { InstrumentBreakdown } from "./instrument-breakdown.tsx";
import { PerformanceChart } from "./performance-chart.tsx";
import { OpenPositions } from "./records/open-positions.tsx";
import { TradeDialog } from "./records/trade-dialog.tsx";
import { TradeTable } from "./records/trade-table.tsx";

export function JournalPage() {
  const { t, format } = useLocale();
  const dialog = useRef<HTMLDialogElement>(null);
  const trades = useJournal((state) => state.trades);
  const status = useJournal((state) => state.status);
  const load = useJournal((state) => state.load);
  const [search, setSearch] = useState("");
  const [side, setSide] = useState(FILTER_ALL);
  const [from, setFrom] = useState("");
  const [through, setThrough] = useState("");
  const invalidRange = Boolean(from && through && from > through);
  const query = useDeferredValue(search.trim().toUpperCase());
  const filtered = useMemo(
    () => filterTrades(trades ?? [], { query, side, from, through }),
    [trades, query, side, from, through],
  );
  const metrics = useMemo(() => summarize(filtered), [filtered]);

  return (
    <main>
      <div className="page-heading">
        <h1>{t.journal}</h1>
        <button disabled={!trades} onClick={() => dialog.current?.showModal()}>
          <span aria-hidden="true">＋</span> {t.record}
        </button>
      </div>
      <div className="journal-filters">
        <label>
          {t.filterSymbol}
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="EURUSD"
          />
        </label>
        <SelectField
          label={t.side}
          value={side}
          onChange={(event) => setSide(event.target.value)}
        >
          <option value={FILTER_ALL}>{t.allSides}</option>
          <option value={TRADE_SIDE.LONG}>{t.long}</option>
          <option value={TRADE_SIDE.SHORT}>{t.short}</option>
        </SelectField>
        <label>
          {t.fromDate}
          <input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </label>
        <label>
          {t.toDate}
          <input
            type="date"
            value={through}
            onChange={(event) => setThrough(event.target.value)}
            aria-invalid={invalidRange}
            aria-describedby={invalidRange ? "date-range-error" : undefined}
          />
        </label>
        {(search || side !== FILTER_ALL || from || through) && (
          <button
            className="secondary"
            onClick={() => {
              setSearch("");
              setSide(FILTER_ALL);
              setFrom("");
              setThrough("");
            }}
          >
            {t.resetFilters}
          </button>
        )}
      </div>
      {invalidRange && (
        <p id="date-range-error" className="error" role="alert">
          {t.invalidDateRange}
        </p>
      )}
      <section className="metrics" aria-label={t.statistics}>
        <Metric
          label={t.count}
          value={trades ? format.integer.format(metrics.count) : EMPTY_VALUE}
        />
        <Metric
          label={t.pnl}
          value={trades ? format.money.format(metrics.net) : EMPTY_VALUE}
        />
        <Metric
          label={t.win}
          value={
            metrics.winRate === null
              ? EMPTY_VALUE
              : format.percentage.format(metrics.winRate)
          }
        />
      </section>
      {status === JOURNAL_STATUS.ERROR && (
        <div role="alert">
          <p className="error">{t.loadError}</p>
          <button onClick={() => void load()}>{t.retry}</button>
        </div>
      )}
      <div className="layout">
        <OpenPositions ready={status === JOURNAL_STATUS.READY} />
        <div className="journal-overview">
          <Panel
            title={t.cumulative}
            detail={from || through ? t.filteredPeriod : t.allTime}
          >
            {trades ? (
              <PerformanceChart trades={filtered} />
            ) : (
              <p>
                {status === JOURNAL_STATUS.ERROR ? t.unavailable : t.loading}
              </p>
            )}
          </Panel>
          <Panel title={t.instrumentPerformance}>
            {trades ? (
              <InstrumentBreakdown trades={filtered} />
            ) : (
              <p>
                {status === JOURNAL_STATUS.ERROR ? t.unavailable : t.loading}
              </p>
            )}
          </Panel>
        </div>
        <Panel
          title={t.positions}
          detail={
            trades && `${t.recorded}: ${format.integer.format(filtered.length)}`
          }
        >
          {trades ? (
            filtered.length || trades.length === 0 ? (
              <TradeTable trades={filtered} />
            ) : (
              <p>{t.noMatches}</p>
            )
          ) : (
            <p>{status === JOURNAL_STATUS.ERROR ? t.unavailable : t.loading}</p>
          )}
        </Panel>
      </div>
      <TradeDialog dialog={dialog} />
    </main>
  );
}
