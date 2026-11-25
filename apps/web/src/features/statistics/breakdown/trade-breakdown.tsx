import { fromCents, toCents } from "@liquidation/domain/shared/money";
import { TRADE_FACTOR } from "@liquidation/domain/analytics/constants";
import { tradeBreakdown } from "@liquidation/domain/analytics/trade-factors";
import type { TradeStatistics } from "@liquidation/domain/analytics/types";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { SORT_DIRECTION } from "../../../shared/analytics/constants.ts";
import { nextSort, sortRows } from "../../../shared/analytics/sort.ts";
import { SortableHeader } from "../../../shared/analytics/sortable-header.tsx";
import type { SortState } from "../../../shared/analytics/types.ts";
import { EMPTY_VALUE, LOCALES } from "../../../shared/constants.ts";
import { numericTone } from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import { InfoTip } from "../../../shared/ui/info-tip.tsx";
import { Panel } from "../../../shared/ui/layout.tsx";
import { SelectField } from "../../../shared/ui/select-field.tsx";
import { TradeTable } from "../../journal/records/trade-table.tsx";
import {
  ACCOUNT_TRADE_COLUMNS,
  CHRONOLOGICAL_FACTORS,
  COMPACT_TRADE_COLUMNS,
  FACTOR_SECTIONS,
  FULL_TRADE_COLUMNS,
  TRADE_COLUMN,
} from "../constants.ts";
import {
  GroupCheckbox,
  GroupCheckboxHeader,
  useTradeGroupSelection,
} from "../group-selection.tsx";
import { useStatisticsHelp } from "../help-messages.ts";
import { useStatisticsMessages } from "../messages.ts";
import type { AccountBalance, TradeColumn } from "../types.ts";
import type { TradeBreakdownProps, TradeBreakdownTableProps } from "./types.ts";

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
  const { factors: help } = useStatisticsHelp();
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
      <div className="statistics-grouping">
        <SelectField
          label={s.grouping}
          title={s.groupingHint}
          value={factor}
          onChange={(event) => {
            const selectedFactor = Object.values(TRADE_FACTOR).find(
              (value) => value === event.currentTarget.value,
            );
            if (selectedFactor) onFactor(selectedFactor);
          }}
        >
          {Object.entries(FACTOR_SECTIONS).map(([section, factors]) => (
            <optgroup
              key={section}
              label={s[section as keyof typeof FACTOR_SECTIONS]}
            >
              {factors.map((key) => (
                <option key={key} value={key}>
                  {s[key]}
                </option>
              ))}
            </optgroup>
          ))}
        </SelectField>
        <InfoTip label={s.grouping} text={s.groupingHint} />
        <p className="analytics-hint">{help[factor]}</p>
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

function columnValue(
  column: Exclude<TradeColumn, typeof TRADE_COLUMN.GROUP>,
  metrics: TradeStatistics,
  balance?: AccountBalance,
) {
  if (column === TRADE_COLUMN.OPENING || column === TRADE_COLUMN.BALANCE)
    return balance?.[column] ?? null;
  return metrics[column];
}

export function TradeBreakdownTable({
  factor,
  trades,
  totals,
  labelFor,
  selected,
  onSelect,
  compact = false,
  knownKeys,
  balances,
}: TradeBreakdownTableProps) {
  const s = useStatisticsMessages();
  const { factors: factorHelp, metrics: metricHelp } = useStatisticsHelp();
  const { t, language, format } = useLocale();
  const detailsId = useId();
  const detailTitle = useRef<HTMLHeadingElement>(null);
  const latestFirst = factor === TRADE_FACTOR.YEAR;
  const [sort, setSort] = useState<SortState<TradeColumn>>({
    column: TRADE_COLUMN.GROUP,
    direction: latestFirst
      ? SORT_DIRECTION.DESCENDING
      : SORT_DIRECTION.ASCENDING,
  });
  const rows = useMemo(
    () => tradeBreakdown(trades, factor, knownKeys),
    [trades, factor, knownKeys],
  );
  const selection = useTradeGroupSelection(rows);
  const ordered = useMemo(() => {
    const compare = new Intl.Collator(LOCALES[language], { numeric: true })
      .compare;
    return sortRows(
      rows,
      (row) => {
        if (sort.column !== TRADE_COLUMN.GROUP)
          return columnValue(sort.column, row.metrics, balances?.get(row.key));
        if (!row.key) return null;
        return CHRONOLOGICAL_FACTORS.has(factor)
          ? row.key
          : labelFor(factor, row.key);
      },
      sort.direction,
      compare,
    );
  }, [balances, factor, labelFor, language, rows, sort]);
  const current = rows.find(
    (row) => row.key === selected && row.records.length > 0,
  );
  const activeKey = current?.key;
  useEffect(() => {
    if (activeKey !== undefined) detailTitle.current?.focus();
  }, [activeKey]);

  const columns: Record<TradeColumn, string> = {
    [TRADE_COLUMN.GROUP]: s[factor],
    [TRADE_COLUMN.OPENING]: s.openingShort,
    [TRADE_COLUMN.BALANCE]: s.balanceShort,
    [TRADE_COLUMN.COUNT]: compact ? s.tradeCount : t.count,
    [TRADE_COLUMN.WIN_RATE]: compact ? s.winRateShort : t.win,
    [TRADE_COLUMN.NET]: compact ? "P&L" : t.pnl,
    [TRADE_COLUMN.PROFIT_FACTOR]: t.profitFactor,
    [TRADE_COLUMN.PAYOFF]: compact ? s.payoffShort : s.avgRR,
    [TRADE_COLUMN.EXPECTANCY]: s.expectancy,
    [TRADE_COLUMN.TOTAL_R]: compact ? "Σ R" : t.result,
  };
  const keys: readonly TradeColumn[] = compact
    ? balances
      ? ACCOUNT_TRADE_COLUMNS
      : COMPACT_TRADE_COLUMNS
    : FULL_TRADE_COLUMNS;
  const name = s[factor];

  function balanceTotals(keys?: ReadonlySet<string>) {
    const knownBalances = rows.flatMap(({ key }) => {
      const balance = balances?.get(key);
      return balance && (!keys || keys.has(key)) ? [balance] : [];
    });
    return knownBalances.length
      ? {
          openingBalance: fromCents(
            knownBalances.reduce(
              (sum, value) => sum + toCents(value.openingBalance),
              0,
            ),
          ),
          balance: fromCents(
            knownBalances.reduce(
              (sum, value) => sum + toCents(value.balance),
              0,
            ),
          ),
        }
      : undefined;
  }

  function metricCells(metrics: TradeStatistics, balance?: AccountBalance) {
    return keys
      .filter((key) => key !== TRADE_COLUMN.GROUP)
      .map((key) => {
        const value = columnValue(key, metrics, balance);
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

  if (!rows.length)
    return (
      <p role="status" className="statistics-empty">
        {t.noMatches}
      </p>
    );
  return (
    <>
      {factor === TRADE_FACTOR.MISTAKE && (
        <p className="analytics-hint">{s.tagsHint}</p>
      )}
      {balances && <p className="analytics-hint">{s.accountScope}</p>}
      <div
        className={
          "table analytics-table statistics-factor-table" +
          (compact ? " compact-factor-table" : "")
        }
        role="region"
        tabIndex={0}
        aria-label={name}
      >
        <table aria-label={name}>
          <thead>
            <tr>
              <GroupCheckboxHeader selection={selection} />
              {keys.map((column) => (
                <SortableHeader
                  key={column}
                  label={columns[column]}
                  title={
                    column === TRADE_COLUMN.GROUP
                      ? factorHelp[factor]
                      : metricHelp[column]
                  }
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
              {!compact && <th scope="col">{s.inspect}</th>}
            </tr>
          </thead>
          <tbody>
            {ordered.map(({ key, metrics, records }) => {
              const label = labelFor(factor, key);
              const expanded = current?.key === key;
              const canInspect = records.length > 0;
              const action = (
                <button
                  type="button"
                  className={compact ? "statistics-group-link" : "secondary"}
                  aria-expanded={expanded}
                  aria-controls={detailsId}
                  aria-label={s.inspect + " · " + label}
                  onClick={() => onSelect(expanded ? null : key)}
                  disabled={!canInspect}
                >
                  {compact ? label : s.inspect}
                </button>
              );
              return (
                <tr key={key} data-active={expanded || undefined}>
                  <GroupCheckbox
                    selection={selection}
                    groupKey={key}
                    label={label}
                  />
                  <th scope="row">{compact && canInspect ? action : label}</th>
                  {metricCells(metrics, balances?.get(key))}
                  {!compact && <td>{action}</td>}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td />
              <th scope="row">{s.totals}</th>
              {metricCells(totals, balanceTotals())}
              {!compact && <td />}
            </tr>
            {selection.keys.size > 0 && (
              <tr className="selected-subtotal" aria-live="polite">
                <td />
                <th scope="row">
                  {s.chosenTotal} · {selection.keys.size}
                </th>
                {metricCells(selection.metrics, balanceTotals(selection.keys))}
                {!compact && <td />}
              </tr>
            )}
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
