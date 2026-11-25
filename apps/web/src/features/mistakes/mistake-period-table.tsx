import { useState } from "react";
import { SORT_DIRECTION } from "../../shared/analytics/constants.ts";
import { nextSort, sortRows } from "../../shared/analytics/sort.ts";
import { SortableHeader } from "../../shared/analytics/sortable-header.tsx";
import type { SortState } from "../../shared/analytics/types.ts";
import { EMPTY_VALUE, LOCALES } from "../../shared/constants.ts";
import { useLocale } from "../../shared/messages.ts";
import { Panel } from "../../shared/ui/layout.tsx";
import { TradeTable } from "../journal/records/trade-table.tsx";
import {
  GroupCheckbox,
  GroupCheckboxHeader,
  GroupSelectionSummary,
  useTradeGroupSelection,
} from "../statistics/group-selection.tsx";
import { MISTAKE_PERIOD_COLUMN } from "./constants.ts";
import { useMistakeMessages } from "./messages.ts";
import type { MistakePeriodColumn, MistakePeriodTableProps } from "./types.ts";

export function MistakePeriodTable({
  rows,
  title,
  heading,
  label,
  chronological = false,
}: MistakePeriodTableProps) {
  const { format, language, t } = useLocale();
  const m = useMistakeMessages();
  const selection = useTradeGroupSelection(rows);
  const [selected, setSelected] = useState<string>();
  const [sort, setSort] = useState<SortState<MistakePeriodColumn>>({
    column: MISTAKE_PERIOD_COLUMN.GROUP,
    direction: chronological
      ? SORT_DIRECTION.ASCENDING
      : SORT_DIRECTION.DESCENDING,
  });
  const active = rows.find((row) => row.key === selected);
  const columns = {
    [MISTAKE_PERIOD_COLUMN.GROUP]: heading,
    [MISTAKE_PERIOD_COLUMN.CLOSED]: t.count,
    [MISTAKE_PERIOD_COLUMN.REVIEWED]: m.coverage,
    [MISTAKE_PERIOD_COLUMN.AFFECTED]: m.affected,
    [MISTAKE_PERIOD_COLUMN.OCCURRENCES]: m.count,
    [MISTAKE_PERIOD_COLUMN.CRITICAL]: m.critical,
    [MISTAKE_PERIOD_COLUMN.RATE]: m.occurrenceRate,
  };
  const compare = new Intl.Collator(LOCALES[language], { numeric: true })
    .compare;
  const ordered = sortRows(
    rows,
    (row) => row[sort.column],
    sort.direction,
    compare,
  );
  return (
    <Panel title={title}>
      {rows.length ? (
        <>
          <div className="table analytics-table mistake-period-table">
            <table aria-label={title}>
              <thead>
                <tr>
                  <GroupCheckboxHeader selection={selection} />
                  {(Object.keys(columns) as MistakePeriodColumn[]).map(
                    (column) => (
                      <SortableHeader
                        key={column}
                        label={columns[column]}
                        direction={
                          sort.column === column ? sort.direction : undefined
                        }
                        onSort={() =>
                          setSort((previous) => nextSort(previous, column))
                        }
                      />
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {ordered.map((row) => (
                  <tr
                    key={row.key}
                    data-active={active?.key === row.key || undefined}
                  >
                    <GroupCheckbox
                      selection={selection}
                      groupKey={row.key}
                      label={label(row.key)}
                    />
                    <th scope="row">
                      {row.records.length ? (
                        <button
                          type="button"
                          className="statistics-group-link"
                          aria-pressed={active?.key === row.key}
                          onClick={() =>
                            setSelected((current) =>
                              current === row.key ? undefined : row.key,
                            )
                          }
                        >
                          {label(row.key)}
                        </button>
                      ) : (
                        label(row.key)
                      )}
                    </th>
                    <td>{row.closed}</td>
                    <td>{row.reviewed}</td>
                    <td>{row.affected}</td>
                    <td>{row.occurrences}</td>
                    <td
                      className={
                        row.criticalOccurrences ? "negative" : undefined
                      }
                    >
                      {row.criticalOccurrences}
                    </td>
                    <td>
                      {row.rate === null
                        ? EMPTY_VALUE
                        : format.percentage.format(row.rate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <GroupSelectionSummary selection={selection} />
          {selection.keys.size > 0 && (
            <p className="analytics-hint">
              {m.count} ·{" "}
              {rows
                .filter((row) => selection.keys.has(row.key))
                .reduce((sum, row) => sum + row.occurrences, 0)}{" "}
              · {m.critical}{" "}
              {rows
                .filter((row) => selection.keys.has(row.key))
                .reduce((sum, row) => sum + row.criticalOccurrences, 0)}
            </p>
          )}
          {active && <TradeTable trades={active.records} />}
        </>
      ) : (
        <p>{m.noHistory}</p>
      )}
    </Panel>
  );
}
