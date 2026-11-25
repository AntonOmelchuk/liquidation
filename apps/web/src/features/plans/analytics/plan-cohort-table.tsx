import { useEffect, useId, useRef, useState } from "react";
import { SORT_DIRECTION } from "../../../shared/analytics/constants.ts";
import { nextSort, sortRows } from "../../../shared/analytics/sort.ts";
import { SortableHeader } from "../../../shared/analytics/sortable-header.tsx";
import type { SortState } from "../../../shared/analytics/types.ts";
import { EMPTY_VALUE, LOCALES } from "../../../shared/constants.ts";
import { numericTone } from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import { planTableGroups } from "../list/filters.ts";
import { PlansTable } from "../list/plans-table.tsx";
import { usePlanMessages } from "../messages.ts";
import { PLAN_COLUMN } from "./constants.ts";
import type { PlanCohortTableProps, PlanColumn } from "./types.ts";

export function PlanCohortTable({
  rows,
  heading,
  label,
  execution,
  today,
  selected,
  onSelect,
}: PlanCohortTableProps) {
  const { t, language, format } = useLocale();
  const p = usePlanMessages();
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const detailsId = useId();
  const [sort, setSort] = useState<SortState<PlanColumn>>({
    column: PLAN_COLUMN.PLANS,
    direction: SORT_DIRECTION.DESCENDING,
  });

  const active = rows.find(({ key }) => key === selected);
  const activeKey = active?.key;
  useEffect(() => {
    if (activeKey) detailHeading.current?.focus();
  }, [activeKey]);

  const count = (value: number) => format.integer.format(value);
  const inR = (value: number | null) =>
    value === null ? EMPTY_VALUE : `${format.money.format(value)} R`;
  const columns = {
    [PLAN_COLUMN.GROUP]: heading,
    [PLAN_COLUMN.PLANS]: p.analyticsPlanCount,
    [PLAN_COLUMN.OVERALL_WIN_RATE]: p.planWinRate,
    [PLAN_COLUMN.WIN_RATE]: p.reviewedWinRate,
    [PLAN_COLUMN.REALIZED_R]: `${p.realized} (R)`,
    [PLAN_COLUMN.MISSED]: p.analyticsMissed,
    [PLAN_COLUMN.MISSED_R]: p.analyticsMissedR,
  };
  const compare = new Intl.Collator(LOCALES[language], { numeric: true })
    .compare;
  const sorted = sortRows(
    rows,
    (row) => {
      if (sort.column === PLAN_COLUMN.GROUP) return label(row);
      if (sort.column === PLAN_COLUMN.PLANS) return row.plans.length;
      return row[sort.column];
    },
    sort.direction,
    compare,
  );

  return (
    <>
      <div
        className="table analytics-table plan-analytics-table"
        role="region"
        aria-label={p.analyticsTitle}
        tabIndex={0}
      >
        <table aria-label={p.analyticsTitle}>
          <thead>
            <tr>
              {(Object.keys(columns) as PlanColumn[]).map((column) => (
                <SortableHeader
                  key={column}
                  label={columns[column]}
                  title={
                    column === PLAN_COLUMN.OVERALL_WIN_RATE
                      ? p.planWinRateHint
                      : column === PLAN_COLUMN.WIN_RATE
                        ? p.reviewedWinRateHint
                        : undefined
                  }
                  direction={
                    sort.column === column ? sort.direction : undefined
                  }
                  onSort={() =>
                    setSort((previous) =>
                      nextSort(
                        previous,
                        column,
                        column === PLAN_COLUMN.GROUP
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
            {sorted.map((group) => {
              const name = label(group);
              return (
                <tr
                  key={group.key}
                  data-active={activeKey === group.key || undefined}
                  onClick={() => onSelect(group.key)}
                >
                  <th scope="row">
                    <button
                      type="button"
                      className="plan-analytics-group"
                      aria-label={`${p.analyticsShowPlans} · ${name}`}
                      aria-expanded={activeKey === group.key}
                      aria-controls={detailsId}
                    >
                      {name} <span aria-hidden="true">›</span>
                    </button>
                  </th>
                  <td>{count(group.plans.length)}</td>
                  <td>
                    <strong>
                      {group.allPlanWinRate === null
                        ? EMPTY_VALUE
                        : format.percentage.format(group.allPlanWinRate)}
                    </strong>
                    <small>
                      {count(group.worked)} / {count(group.plans.length)}
                    </small>
                  </td>
                  <td>
                    <strong>
                      {group.winRate === null
                        ? EMPTY_VALUE
                        : format.percentage.format(group.winRate)}
                    </strong>
                    <small>
                      {p.worked} · {count(group.worked)} /{" "}
                      {count(group.reviewed)}
                    </small>
                  </td>
                  <td>
                    <strong className={numericTone(group.realizedR ?? 0)}>
                      {inR(group.realizedR)}
                    </strong>
                    <small>
                      {p.closedTrades} · {count(group.closed)}
                    </small>
                    {group.measured < group.closed && (
                      <small>
                        {p.analyticsWithRisk} · {count(group.measured)} /{" "}
                        {count(group.closed)}
                      </small>
                    )}
                  </td>
                  <td>
                    <strong>{count(group.missed)}</strong>
                  </td>
                  <td>
                    <strong className={numericTone(group.missedR ?? 0)}>
                      {inR(group.missedR)}
                    </strong>
                    {group.missed > 0 && (
                      <small>
                        {p.assessed} · {count(group.assessedMisses)} /{" "}
                        {count(group.missed)}
                      </small>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div id={detailsId}>
        {active && (
          <section className="analytics-details plan-analytics-details">
            <div className="panel-heading">
              <h3 ref={detailHeading} tabIndex={-1}>
                {p.analyticsSample} · {label(active)}
              </h3>
              <button
                type="button"
                className="secondary"
                onClick={() => onSelect(null)}
              >
                {t.close}
              </button>
            </div>
            <PlansTable
              groups={planTableGroups(active.plans, today)}
              execution={execution}
              label={p.analyticsSample}
            />
          </section>
        )}
      </div>
    </>
  );
}
