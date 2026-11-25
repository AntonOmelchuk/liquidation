import { periodStatistics } from "@liquidation/domain/analytics/period-statistics";
import type { Trade } from "@liquidation/domain/trades/types";
import {
  calendarDate,
  periodBounds,
} from "@liquidation/domain/workspace/period";
import { useMemo, useState } from "react";
import { EMPTY_VALUE } from "../../../shared/constants.ts";
import { numericTone } from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import { SelectField } from "../../../shared/ui/select-field.tsx";
import {
  TRADE_GROUPING,
  TRADE_PAGE_SIZES,
  TRADE_TABLE_MODE,
} from "./constants.ts";
import { newestTradeRecord } from "./order.ts";
import { useTradeRecordMessages } from "./messages.ts";
import { TradeDetailsDialog } from "./trade-details-dialog.tsx";
import { TradeRecordRows } from "./trade-record-rows.tsx";
import type { TradeTableProps } from "./types.ts";
import "./trade-records.css";

export function TradeTable({
  trades,
  mode = TRADE_TABLE_MODE.CLOSED,
  grouping = TRADE_GROUPING.ALL,
  label,
  pagination,
}: TradeTableProps) {
  const { t, format } = useLocale();
  const m = useTradeRecordMessages();
  const [selected, setSelected] = useState<string>();
  const [requestedPage, setPage] = useState(0);
  const showFinancialResult = mode !== TRADE_TABLE_MODE.OPEN;
  const record = trades.find((item) => item.id === selected);
  const rows = useMemo(() => trades.toSorted(newestTradeRecord), [trades]);
  const size = pagination?.pageSize ?? Math.max(1, rows.length);
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const page = Math.min(requestedPage, pages - 1);
  const start = page * size;
  const visibleRows = pagination ? rows.slice(start, start + size) : rows;
  const groups = useMemo(
    () =>
      grouping === TRADE_GROUPING.ALL || mode !== TRADE_TABLE_MODE.CLOSED
        ? []
        : periodStatistics(
            rows.filter((record): record is Trade => "closedAt" in record),
            grouping,
          ),
    [grouping, mode, rows],
  );
  const visibleIds =
    pagination && groups.length
      ? new Set(visibleRows.map(({ id }) => id))
      : undefined;
  const visibleGroups = groups.flatMap((group) => {
    if (!visibleIds) return [group];
    const records = group.records.filter(({ id }) => visibleIds.has(id));
    return records.length ? [{ ...group, records }] : [];
  });
  const name =
    label ?? (mode === TRADE_TABLE_MODE.OPEN ? t.openPositions : t.positions);
  if (!rows.length)
    return (
      <p>{mode === TRADE_TABLE_MODE.OPEN ? t.noOpenPositions : t.noTrades}</p>
    );
  return (
    <>
      <div
        className="table trade-ledger"
        data-mode={mode}
        role="region"
        aria-label={name}
        title={m.compactHelp}
        tabIndex={0}
      >
        <table aria-label={name}>
          <thead>
            <tr>
              <th scope="col" title={m.dateHelp}>
                {mode === TRADE_TABLE_MODE.OPEN
                  ? t.opened
                  : mode === TRADE_TABLE_MODE.CLOSED
                    ? t.closed
                    : m.date}
              </th>
              <th scope="col">{t.account}</th>
              <th scope="col">{t.symbol}</th>
              <th scope="col">{t.side}</th>
              <th scope="col">{m.style}</th>
              <th scope="col" title={t.timeframe}>
                {m.timeframe}
              </th>
              <th
                scope="col"
                className="trade-number"
                title={m.initialRiskHelp}
              >
                {m.risk}
              </th>
              <th scope="col" title={m.flatHelp}>
                {m.result}
              </th>
              {showFinancialResult && (
                <>
                  <th scope="col" className="trade-number">
                    {t.pnl}
                  </th>
                  <th scope="col" className="trade-number" title={t.result}>
                    {m.r}
                  </th>
                </>
              )}
            </tr>
          </thead>
          {visibleGroups.length && grouping !== TRADE_GROUPING.ALL ? (
            visibleGroups.map((group) => (
              <tbody key={group.key}>
                <tr className="trade-ledger-group">
                  <th scope="rowgroup" colSpan={6}>
                    <span>
                      {format.day.formatRange(
                        calendarDate(group.key),
                        calendarDate(periodBounds(grouping, group.key).through),
                      )}
                    </span>
                    <span className="subdued">
                      {format.integer.format(group.metrics.count)} · {t.count}
                    </span>
                  </th>
                  <td colSpan={2}>
                    WR{" "}
                    {group.metrics.winRate === null
                      ? EMPTY_VALUE
                      : format.percentage.format(group.metrics.winRate)}
                  </td>
                  <td
                    className={
                      "trade-number " + (numericTone(group.metrics.net) ?? "")
                    }
                  >
                    {format.money.format(group.metrics.net)}
                  </td>
                  <td
                    className={
                      "trade-number " +
                      (numericTone(group.metrics.totalR ?? 0) ?? "")
                    }
                  >
                    {group.metrics.totalR === null
                      ? EMPTY_VALUE
                      : format.money.format(group.metrics.totalR)}
                  </td>
                </tr>
                <TradeRecordRows
                  records={group.records}
                  onInspect={setSelected}
                  showFinancialResult={showFinancialResult}
                />
              </tbody>
            ))
          ) : (
            <tbody>
              <TradeRecordRows
                records={visibleRows}
                onInspect={setSelected}
                showFinancialResult={showFinancialResult}
              />
            </tbody>
          )}
        </table>
      </div>
      {pagination && (
        <nav className="trade-pagination" aria-label={m.pagination}>
          <SelectField
            label={m.tradesPerPage}
            value={size}
            onChange={(event) => {
              const next = TRADE_PAGE_SIZES.find(
                (value) => value === Number(event.currentTarget.value),
              );
              if (!next) return;
              pagination.onPageSizeChange(next);
              setPage(0);
            }}
          >
            {TRADE_PAGE_SIZES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </SelectField>
          <span role="status" className="trade-page-count">
            {format.integer.format(start + 1)}–
            {format.integer.format(start + visibleRows.length)} {m.of}{" "}
            {format.integer.format(rows.length)}
          </span>
          <div className="trade-page-actions">
            <button
              type="button"
              className="secondary"
              aria-label={m.previousPage}
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              ←
            </button>
            <span>
              {m.page} {page + 1} / {pages}
            </span>
            <button
              type="button"
              className="secondary"
              aria-label={m.nextPage}
              disabled={page === pages - 1}
              onClick={() => setPage(page + 1)}
            >
              →
            </button>
          </div>
        </nav>
      )}
      {record && (
        <TradeDetailsDialog
          key={record.id}
          record={record}
          onClose={() => setSelected(undefined)}
        />
      )}
    </>
  );
}
