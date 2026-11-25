import { MISTAKE_TREND } from "@liquidation/domain/analytics/constants";
import { useState } from "react";
import { SORT_DIRECTION } from "../../shared/analytics/constants.ts";
import { nextSort, sortRows } from "../../shared/analytics/sort.ts";
import { SortableHeader } from "../../shared/analytics/sortable-header.tsx";
import type { SortState } from "../../shared/analytics/types.ts";
import { EMPTY_VALUE, LOCALES } from "../../shared/constants.ts";
import { numericTone } from "../../shared/format.ts";
import { useLocale } from "../../shared/messages.ts";
import {
  GroupCheckbox,
  GroupCheckboxHeader,
  GroupSelectionSummary,
  useTradeGroupSelection,
} from "../statistics/group-selection.tsx";
import { MISTAKE_COLUMN } from "./constants.ts";
import { mistakeLabel, useMistakeMessages } from "./messages.ts";
import type { MistakeColumn, MistakeSummaryProps } from "./types.ts";

export function MistakeSummaryTable({
  rows,
  focus,
  onFocus,
}: MistakeSummaryProps) {
  const { t, language, format } = useLocale();
  const m = useMistakeMessages();
  const selection = useTradeGroupSelection(rows);
  const [sort, setSort] = useState<SortState<MistakeColumn>>({
    column: MISTAKE_COLUMN.COUNT,
    direction: SORT_DIRECTION.DESCENDING,
  });
  const columns = {
    [MISTAKE_COLUMN.LABEL]: t.mistakes,
    [MISTAKE_COLUMN.COUNT]: m.count,
    [MISTAKE_COLUMN.CRITICAL]: m.critical,
    [MISTAKE_COLUMN.RATE]: m.occurrenceRate,
    [MISTAKE_COLUMN.NET]: m.associatedNet,
    [MISTAKE_COLUMN.LOSSES]: m.loss,
    [MISTAKE_COLUMN.PREVIOUS]: m.previous,
    [MISTAKE_COLUMN.RECENT]: m.latest,
    [MISTAKE_COLUMN.TREND]: m.direction,
  };
  const compare = new Intl.Collator(LOCALES[language], { numeric: true })
    .compare;
  const ordered = sortRows(
    rows,
    (row) => {
      if (sort.column === MISTAKE_COLUMN.LABEL)
        return mistakeLabel(row.label, language);
      if (
        sort.column === MISTAKE_COLUMN.PREVIOUS ||
        sort.column === MISTAKE_COLUMN.RECENT
      )
        return row[sort.column].rate;
      if (sort.column === MISTAKE_COLUMN.TREND)
        return row.recent.rate === null || row.previous.rate === null
          ? null
          : row.recent.rate - row.previous.rate;
      return row[sort.column];
    },
    sort.direction,
    compare,
  );
  const percentage = (value: number | null) =>
    value === null ? EMPTY_VALUE : format.percentage.format(value);
  if (!rows.length) return <p>{m.noRows}</p>;
  return (
    <>
      <div className="table analytics-table mistake-summary-table">
        <table aria-label={m.summary}>
          <thead>
            <tr>
              <GroupCheckboxHeader selection={selection} />
              {(Object.keys(columns) as MistakeColumn[]).map((column) => (
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
                        column === MISTAKE_COLUMN.LABEL
                          ? SORT_DIRECTION.ASCENDING
                          : SORT_DIRECTION.DESCENDING,
                      ),
                    )
                  }
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {ordered.map((row) => {
              const label = mistakeLabel(row.label, language);
              return (
                <tr key={row.key} data-active={focus === row.key || undefined}>
                  <GroupCheckbox
                    selection={selection}
                    groupKey={row.key}
                    label={label}
                  />
                  <th scope="row">
                    <button
                      type="button"
                      className="statistics-group-link"
                      aria-pressed={focus === row.key}
                      onClick={() =>
                        onFocus(focus === row.key ? undefined : row.key)
                      }
                    >
                      {label}
                    </button>
                  </th>
                  <td>{format.integer.format(row.count)}</td>
                  <td className={row.criticalCount ? "negative" : undefined}>
                    {format.integer.format(row.criticalCount)}
                  </td>
                  <td>{percentage(row.rate)}</td>
                  <td className={numericTone(row.net)}>
                    {format.money.format(row.net)}
                  </td>
                  <td className={numericTone(row.losses)}>
                    {format.money.format(row.losses)}
                  </td>
                  <td>
                    {percentage(row.previous.rate)}{" "}
                    <small>
                      {row.previous.occurrences}/{row.previous.count}
                    </small>
                  </td>
                  <td>
                    {percentage(row.recent.rate)}{" "}
                    <small>
                      {row.recent.occurrences}/{row.recent.count}
                    </small>
                  </td>
                  <td>
                    <span
                      className={
                        row.trend === MISTAKE_TREND.INCREASED
                          ? "negative"
                          : row.trend === MISTAKE_TREND.DECREASED
                            ? "positive"
                            : undefined
                      }
                    >
                      {m[row.trend]}
                    </span>
                    {row.recent.rate !== null && row.previous.rate !== null && (
                      <small>
                        {format.price.format(
                          (row.recent.rate - row.previous.rate) * 100,
                        )}{" "}
                        pp
                      </small>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <GroupSelectionSummary selection={selection} />
      {selection.keys.size > 0 && (
        <p className="analytics-hint">
          {m.count} ·{" "}
          {rows
            .filter((row) => selection.keys.has(row.key))
            .reduce((sum, row) => sum + row.count, 0)}{" "}
          · {m.critical}{" "}
          {rows
            .filter((row) => selection.keys.has(row.key))
            .reduce((sum, row) => sum + row.criticalCount, 0)}
        </p>
      )}
    </>
  );
}
