import { DashboardAccounts } from "../accounts/dashboard-accounts.tsx";
import { useAccountOptions } from "../accounts/account-options.ts";
import { useAccountMessages } from "../accounts/messages.ts";
import { TRADE_SIDE } from "@liquidation/domain/trades/constants";
import { tradeStatistics } from "@liquidation/domain/analytics/trade-statistics";
import { localDay } from "@liquidation/domain/workspace/period";
import { useDeferredValue, useMemo, useState } from "react";
import {
  NEW_TRADE_HREF,
  OPEN_POSITION_HREF,
  RECENT_REVIEW_HREF,
} from "../../app/constants.ts";
import { AnalyticsSelect } from "../../shared/analytics/filter-fields.tsx";
import { EMPTY_VALUE, FILTER_ALL } from "../../shared/constants.ts";
import { useLocale } from "../../shared/messages.ts";
import { InfoTip } from "../../shared/ui/info-tip.tsx";
import { Metric, Panel } from "../../shared/ui/layout.tsx";
import { SelectField } from "../../shared/ui/select-field.tsx";
import { QuotePanel } from "../market/quote-panel.tsx";
import "../market/market.css";
import { useWorkspaceMessages } from "../workspace/messages.ts";
import {
  MissedTradesPanel,
  MissedTradesShortcut,
} from "../workspace/planning/missed-trades-panel.tsx";
import "../workspace/workspace.css";
import { PnlCalendar } from "./dashboard/pnl-calendar.tsx";
import { JournalOverview } from "./dashboard/journal-overview.tsx";
import { JOURNAL_STATUS } from "./data/constants.ts";
import { useJournal } from "./data/store.ts";
import { filterJournalRecords } from "./filters.ts";
import { InstrumentBreakdown } from "./instrument-breakdown.tsx";
import { PerformanceChart } from "./performance-chart.tsx";
import { OpenPositions } from "./records/open-positions.tsx";
import {
  DEFAULT_TRADE_PAGE_SIZE,
  TRADE_GROUPING,
} from "./records/constants.ts";
import { useTradeRecordMessages } from "./records/messages.ts";
import type { TradeGrouping, TradePageSize } from "./records/types.ts";
import { TradeTable } from "./records/trade-table.tsx";
import "./dashboard/dashboard.css";

export function JournalPage() {
  const { t, format } = useLocale();
  const m = useWorkspaceMessages();
  const records = useTradeRecordMessages();
  const [pageSize, setPageSize] = useState<TradePageSize>(
    DEFAULT_TRADE_PAGE_SIZE,
  );
  const [grouping, setGrouping] = useState<TradeGrouping>(TRADE_GROUPING.WEEK);
  const trades = useJournal((state) => state.trades);
  const positions = useJournal((state) => state.positions);
  const status = useJournal((state) => state.status);
  const load = useJournal((state) => state.load);
  const [search, setSearch] = useState("");
  const [account, setAccount] = useState<string>();
  const accountOptions = useAccountOptions();
  const accounts = useAccountMessages();
  const [side, setSide] = useState(FILTER_ALL);
  const [from, setFrom] = useState("");
  const [through, setThrough] = useState("");
  const invalidRange = Boolean(from && through && from > through);
  const query = useDeferredValue(search.trim().toUpperCase());
  const { filtered, filteredPositions } = useMemo(() => {
    const criteria = { query, side, from, through, account };
    return {
      filtered: filterJournalRecords(trades ?? [], criteria),
      filteredPositions: filterJournalRecords(positions, criteria),
    };
  }, [trades, positions, query, side, from, through, account]);
  const metrics = useMemo(() => tradeStatistics(filtered), [filtered]);
  const today = localDay(new Date().toISOString());
  const initialMonth = useMemo(() => {
    let latest = -Infinity;
    for (const trade of filtered)
      latest = Math.max(latest, Date.parse(trade.closedAt));
    for (const position of filteredPositions)
      latest = Math.max(latest, Date.parse(position.openedAt));
    const day = Number.isFinite(latest)
      ? localDay(new Date(latest).toISOString())
      : today;
    return day.slice(0, 7);
  }, [filtered, filteredPositions, today]);

  return (
    <main className="journal-dashboard">
      <div className="page-heading">
        <h1>{t.journal}</h1>
        <div className="workspace-actions">
          <MissedTradesShortcut disabled={!trades} />
          <a className="action-link secondary" href={RECENT_REVIEW_HREF}>
            {m.recent}
          </a>
          {trades ? (
            <a className="action-link" href={OPEN_POSITION_HREF}>
              <span aria-hidden="true">＋</span> {t.record}
            </a>
          ) : (
            <button type="button" disabled>
              {t.record}
            </button>
          )}
        </div>
      </div>
      <QuotePanel />
      {status === JOURNAL_STATUS.READY && <DashboardAccounts />}
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
        <AnalyticsSelect
          label={t.account}
          all={accounts.all}
          options={accountOptions}
          value={account}
          onChange={setAccount}
        />
        <label>
          {m.calendarFrom}
          <input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </label>
        <label>
          {m.calendarThrough}
          <input
            type="date"
            value={through}
            onChange={(event) => setThrough(event.target.value)}
            aria-invalid={invalidRange}
            aria-describedby={invalidRange ? "date-range-error" : undefined}
          />
        </label>
        {(search ||
          side !== FILTER_ALL ||
          account !== undefined ||
          from ||
          through) && (
          <button
            className="secondary"
            onClick={() => {
              setSearch("");
              setSide(FILTER_ALL);
              setAccount(undefined);
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
      <section className="metrics dashboard-metrics" aria-label={t.statistics}>
        <Metric
          label={t.pnl}
          value={trades ? format.money.format(metrics.net) : EMPTY_VALUE}
          detail={
            trades
              ? t.count + " · " + format.integer.format(metrics.count)
              : undefined
          }
        />
        <Metric
          label={t.profitFactor}
          value={
            metrics.profitFactor === null
              ? EMPTY_VALUE
              : format.money.format(metrics.profitFactor)
          }
        />
        <Metric
          label={m.expectancy}
          value={
            metrics.expectancy === null
              ? EMPTY_VALUE
              : format.money.format(metrics.expectancy)
          }
        />
        <Metric
          label={m.maxDrawdown}
          value={
            metrics.count
              ? format.money.format(metrics.maxDrawdown)
              : EMPTY_VALUE
          }
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
        <OpenPositions
          ready={status === JOURNAL_STATUS.READY}
          account={account}
        />
        {status === JOURNAL_STATUS.READY && <JournalOverview today={today} />}
        <div className="dashboard-performance">
          {trades && (
            <PnlCalendar
              trades={filtered}
              positions={filteredPositions}
              initialMonth={initialMonth}
              today={today}
            />
          )}
          <div className="layout dashboard-charts">
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
        </div>
        <Panel
          title={t.positions}
          detail={
            <div className="trade-list-toolbar">
              <InfoTip label={records.details} text={records.compactHelp} />
              {trades && (
                <span>
                  {t.recorded} · {format.integer.format(filtered.length)}
                </span>
              )}
              <SelectField
                label={records.grouping}
                value={grouping}
                onChange={(event) => {
                  const value = Object.values(TRADE_GROUPING).find(
                    (value) => value === event.target.value,
                  );
                  if (value) setGrouping(value);
                }}
              >
                {Object.values(TRADE_GROUPING).map((value) => (
                  <option key={value} value={value}>
                    {records[value]}
                  </option>
                ))}
              </SelectField>
              {trades && (
                <a className="action-link secondary" href={NEW_TRADE_HREF}>
                  {t.recordTitle}
                </a>
              )}
            </div>
          }
        >
          {trades ? (
            filtered.length || trades.length === 0 ? (
              <TradeTable
                key={JSON.stringify([
                  query,
                  side,
                  from,
                  through,
                  account,
                  grouping,
                ])}
                trades={filtered}
                grouping={grouping}
                pagination={{ pageSize, onPageSizeChange: setPageSize }}
              />
            ) : (
              <p>{t.noMatches}</p>
            )
          ) : (
            <p>{status === JOURNAL_STATUS.ERROR ? t.unavailable : t.loading}</p>
          )}
        </Panel>
      </div>
      {status === JOURNAL_STATUS.READY && (
        <div className="layout journal-missed">
          <MissedTradesPanel initialDay={today} />
        </div>
      )}
    </main>
  );
}
