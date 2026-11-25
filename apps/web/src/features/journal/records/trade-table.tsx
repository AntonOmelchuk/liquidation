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
import { TRADE_GROUPING, TRADE_TABLE_MODE } from "./constants.ts";
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
}: TradeTableProps) {
  const { t, format } = useLocale();
  const m = useTradeRecordMessages();
  const [selected, setSelected] = useState<string>();
  const showFinancialResult = mode !== TRADE_TABLE_MODE.OPEN;
  const record = trades.find((item) => item.id === selected);
  const rows = useMemo(
    () =>
      trades.toSorted((a, b) => {
        const aAt = "closedAt" in a ? a.closedAt : a.openedAt;
        const bAt = "closedAt" in b ? b.closedAt : b.openedAt;
        return Date.parse(bAt) - Date.parse(aAt) || a.id.localeCompare(b.id);
      }),
    [trades],
  );
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
          {groups.length && grouping !== TRADE_GROUPING.ALL ? (
            groups.map((group) => (
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
                records={rows}
                onInspect={setSelected}
                showFinancialResult={showFinancialResult}
              />
            </tbody>
          )}
        </table>
      </div>
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
