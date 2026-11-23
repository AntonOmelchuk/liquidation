import { TRADE_FACTOR } from "@liquidation/domain/analytics/constants";
import { tradeBreakdown } from "@liquidation/domain/analytics/trade-factors";
import type { TradeStatistics } from "@liquidation/domain/analytics/types";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { TradeBreakdownProps, TradeBreakdownTableProps } from "./types.ts";

import { SORT_DIRECTION } from "../../../shared/analytics/constants.ts";
import { FactorButtons } from "../../../shared/analytics/factor-buttons.tsx";
import { nextSort, sortRows } from "../../../shared/analytics/sort.ts";
import { SortableHeader } from "../../../shared/analytics/sortable-header.tsx";
import type { SortState } from "../../../shared/analytics/types.ts";
import { EMPTY_VALUE, LOCALES } from "../../../shared/constants.ts";
import { numericTone } from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import { Panel } from "../../../shared/ui/layout.tsx";
import { TradeTable } from "../../journal/records/trade-table.tsx";
import {
  CHRONOLOGICAL_FACTORS,
  FACTOR_SECTIONS,
  TRADE_COLUMN,
} from "../constants.ts";
import { useStatisticsMessages } from "../messages.ts";
import type { TradeColumn } from "../types.ts";

export function TradeBreakdown({
  factor,
  onFactor,
  trades,
  totals,
  labelFor,
  selected,
  onSelect,
}: TradeBreakdownProps) {
  const s = useStatisticsMessages();
  const { format } = useLocale();
  return (
    <Panel
      title={s.breakdown}
      detail={
        <span role="status">
          {format.integer.format(totals.count)} · {s.totals}
        </span>
      }
    >
      <div
        className="analytics-factor-list"
        role="group"
        aria-label={s.grouping}
      >
        {Object.entries(FACTOR_SECTIONS).map(([section, factors]) => (
          <div key={section} className="analytics-factor-section">
            <span>{s[section as keyof typeof FACTOR_SECTIONS]}</span>
            <FactorButtons
              label={s[section as keyof typeof FACTOR_SECTIONS]}
              options={factors.map((key) => ({ key, label: s[key] }))}
              value={factor}
              onChange={onFactor}
            />
          </div>
        ))}
      </div>
      <TradeBreakdownTable
        key={factor}
        factor={factor}
        trades={trades}
        totals={totals}
        labelFor={labelFor}
        selected={selected}
        onSelect={onSelect}
      />
    </Panel>
  );
}

function TradeBreakdownTable({
  factor,
  trades,
  totals,
  labelFor,
  selected,
  onSelect,
}: TradeBreakdownTableProps) {
  const s = useStatisticsMessages();
  const { t, language, format } = useLocale();
  const detailsId = useId();
  const detailTitle = useRef<HTMLHeadingElement>(null);
  const latestFirst =
    factor === TRADE_FACTOR.MONTH || factor === TRADE_FACTOR.YEAR;
  const [sort, setSort] = useState<SortState<TradeColumn>>({
    column: TRADE_COLUMN.GROUP,
    direction: latestFirst
      ? SORT_DIRECTION.DESCENDING
      : SORT_DIRECTION.ASCENDING,
  });
  const rows = useMemo(() => tradeBreakdown(trades, factor), [trades, factor]);
  const ordered = useMemo(() => {
    const compare = new Intl.Collator(LOCALES[language], { numeric: true })
      .compare;
    return sortRows(
      rows,
      (row) => {
        if (sort.column !== TRADE_COLUMN.GROUP) return row.metrics[sort.column];
        if (!row.key) return null;
        return CHRONOLOGICAL_FACTORS.has(factor)
          ? row.key
          : labelFor(factor, row.key);
      },
      sort.direction,
      compare,
    );
  }, [factor, labelFor, language, rows, sort]);
  const current = rows.find((row) => row.key === selected);
  const activeKey = current?.key;
  useEffect(() => {
    if (activeKey !== undefined) detailTitle.current?.focus();
  }, [activeKey]);

  const columns = {
    [TRADE_COLUMN.GROUP]: s[factor],
    [TRADE_COLUMN.COUNT]: t.count,
    [TRADE_COLUMN.WIN_RATE]: t.win,
    [TRADE_COLUMN.NET]: t.pnl,
    [TRADE_COLUMN.PROFIT_FACTOR]: t.profitFactor,
    [TRADE_COLUMN.PAYOFF]: s.avgRR,
    [TRADE_COLUMN.EXPECTANCY]: s.expectancy,
    [TRADE_COLUMN.TOTAL_R]: t.result,
  };
  const keys = Object.keys(columns) as TradeColumn[];
  const name = s[factor];

  function metricCells(metrics: TradeStatistics) {
    return keys
      .filter((key) => key !== TRADE_COLUMN.GROUP)
      .map((key) => {
        const value = metrics[key];
        const formatter =
          key === TRADE_COLUMN.COUNT
            ? format.integer
            : key === TRADE_COLUMN.WIN_RATE
              ? format.percentage
              : format.money;
        const directional =
          key === TRADE_COLUMN.NET ||
          key === TRADE_COLUMN.TOTAL_R ||
          key === TRADE_COLUMN.EXPECTANCY;
        return (
          <td
            key={key}
            className={
              directional && value !== null ? numericTone(value) : undefined
            }
          >
            {value === null ? EMPTY_VALUE : formatter.format(value)}
          </td>
        );
      });
  }

  if (!rows.length) return <p role="status">{t.noMatches}</p>;
  return (
    <>
      {factor === TRADE_FACTOR.MISTAKE && (
        <p className="analytics-hint">{s.tagsHint}</p>
      )}
      <div
        className="table analytics-table"
        role="region"
        tabIndex={0}
        aria-label={name}
      >
        <table aria-label={name}>
          <thead>
            <tr>
              {keys.map((column) => (
                <SortableHeader
                  key={column}
                  label={columns[column]}
                  direction={
                    sort.column === column ? sort.direction : undefined
                  }
                  onSort={() =>
                    setSort((previous) =>
                      nextSort(
                        previous,
                        column,
                        column === TRADE_COLUMN.GROUP
                          ? SORT_DIRECTION.ASCENDING
                          : SORT_DIRECTION.DESCENDING,
                      ),
                    )
                  }
                />
              ))}
              <th scope="col">{s.inspect}</th>
            </tr>
          </thead>
          <tbody>
            {ordered.map(({ key, metrics }) => {
              const label = labelFor(factor, key);
              return (
                <tr key={key} data-active={selected === key || undefined}>
                  <th scope="row">{label}</th>
                  {metricCells(metrics)}
                  <td>
                    <button
                      type="button"
                      className="secondary"
                      aria-expanded={selected === key}
                      aria-controls={detailsId}
                      aria-label={`${s.inspect} · ${label}`}
                      onClick={() => onSelect(selected === key ? null : key)}
                    >
                      {s.inspect}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">{s.totals}</th>
              {metricCells(totals)}
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
      <div id={detailsId}>
        {current && (
          <section className="analytics-details">
            <div className="panel-heading">
              <h3 ref={detailTitle} tabIndex={-1}>
                {s.selected} · {labelFor(factor, current.key)}
              </h3>
              <button
                type="button"
                className="secondary"
                onClick={() => onSelect(null)}
              >
                {t.close}
              </button>
            </div>
            <TradeTable trades={current.records} />
          </section>
        )}
      </div>
    </>
  );
}
