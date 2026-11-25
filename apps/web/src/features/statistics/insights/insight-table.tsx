import { INSIGHT_ACTION } from "@liquidation/domain/analytics/constants";
import { useState } from "react";
import { SORT_DIRECTION } from "../../../shared/analytics/constants.ts";
import { nextSort, sortRows } from "../../../shared/analytics/sort.ts";
import { SortableHeader } from "../../../shared/analytics/sortable-header.tsx";
import type { SortState } from "../../../shared/analytics/types.ts";
import { EMPTY_VALUE, LOCALES } from "../../../shared/constants.ts";
import { numericTone } from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import { Panel } from "../../../shared/ui/layout.tsx";
import {
  GroupCheckbox,
  GroupCheckboxHeader,
  GroupSelectionSummary,
  useTradeGroupSelection,
} from "../group-selection.tsx";
import { useStatisticsMessages } from "../messages.ts";
import { INSIGHT_COLUMN } from "./constants.ts";
import { useInsightMessages } from "./messages.ts";
import type { InsightColumn, InsightTableProps } from "./types.ts";

export function InsightTable({
  rows,
  action,
  labelFor,
  onSimulate,
}: InsightTableProps) {
  const m = useInsightMessages();
  const s = useStatisticsMessages();
  const { t, format, language } = useLocale();
  const include = action === INSIGHT_ACTION.INCLUDE;
  const title = include ? m.positive : m.negative;
  const entries = rows.map((row) => ({
    ...row,
    groupKey: JSON.stringify([row.factor, row.key]),
  }));
  const selection = useTradeGroupSelection(
    entries.map(({ groupKey, records }) => ({ key: groupKey, records })),
  );
  const [sort, setSort] = useState<SortState<InsightColumn>>({
    column: INSIGHT_COLUMN.EXPECTANCY,
    direction: include ? SORT_DIRECTION.DESCENDING : SORT_DIRECTION.ASCENDING,
  });
  const columns = {
    [INSIGHT_COLUMN.FACTOR]: m.factor,
    [INSIGHT_COLUMN.GROUP]: s.grouping,
    [INSIGHT_COLUMN.COUNT]: s.tradeCount,
    [INSIGHT_COLUMN.WIN_RATE]: s.winRateShort,
    [INSIGHT_COLUMN.NET]: t.pnl,
    [INSIGHT_COLUMN.EXPECTANCY]: s.expectancy,
    [INSIGHT_COLUMN.EXPECTANCY_R]: s.expectancyR,
    [INSIGHT_COLUMN.PROFIT_FACTOR]: "PF",
  };
  const compare = new Intl.Collator(LOCALES[language], { numeric: true })
    .compare;
  const ordered = sortRows(
    entries,
    (row) => {
      if (sort.column === INSIGHT_COLUMN.FACTOR) return s[row.factor];
      if (sort.column === INSIGHT_COLUMN.GROUP)
        return labelFor(row.factor, row.key);
      return row.metrics[sort.column];
    },
    sort.direction,
    compare,
  );
  const money = (value: number | null) =>
    value === null ? EMPTY_VALUE : format.money.format(value);
  const selectedRules = entries
    .filter((row) => selection.keys.has(row.groupKey))
    .map(({ factor, key }) => ({ factor, key }));
  return (
    <Panel title={title} detail={rows.length}>
      {rows.length ? (
        <>
          <div className="table analytics-table insight-table">
            <table aria-label={title}>
              <thead>
                <tr>
                  <GroupCheckboxHeader selection={selection} />
                  {(Object.keys(columns) as InsightColumn[]).map((column) => (
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
                  ))}
                  <th>{m.sample}</th>
                  <th>{m.scenario}</th>
                </tr>
              </thead>
              <tbody>
                {ordered.map(
                  ({ factor, key, groupKey, metrics, sufficient }) => {
                    const name = labelFor(factor, key);
                    return (
                      <tr key={groupKey}>
                        <GroupCheckbox
                          selection={selection}
                          groupKey={groupKey}
                          label={s[factor] + " · " + name}
                        />
                        <td>{s[factor]}</td>
                        <th scope="row">{name}</th>
                        <td>{metrics.count}</td>
                        <td>
                          {metrics.winRate === null
                            ? EMPTY_VALUE
                            : format.percentage.format(metrics.winRate)}
                        </td>
                        <td className={numericTone(metrics.net)}>
                          {money(metrics.net)}
                        </td>
                        <td className={numericTone(metrics.expectancy ?? 0)}>
                          {money(metrics.expectancy)}
                        </td>
                        <td>
                          {money(metrics.expectancyR)}
                          <small>
                            {metrics.countWithRisk}/{metrics.count}
                          </small>
                        </td>
                        <td>{money(metrics.profitFactor)}</td>
                        <td>
                          <span
                            className="insight-sample"
                            data-sufficient={sufficient}
                          >
                            {sufficient ? m.sufficient : m.small}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="secondary"
                            onClick={() =>
                              onSimulate({ action, rules: [{ factor, key }] })
                            }
                          >
                            {include ? m.include : m.exclude}
                          </button>
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
          <GroupSelectionSummary selection={selection} />
          {selectedRules.length > 0 && (
            <div className="insight-selected-actions">
              <button
                type="button"
                onClick={() => onSimulate({ action, rules: selectedRules })}
              >
                {include ? m.includeSelected : m.excludeSelected}
              </button>
            </div>
          )}
        </>
      ) : (
        <p>{m.noGroups}</p>
      )}
    </Panel>
  );
}
