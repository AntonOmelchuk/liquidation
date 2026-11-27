import {
  PLAN_PERIOD,
  PLAN_STATUSES,
} from "@liquidation/domain/plans/constants";
import { useMemo, useState } from "react";
import { NEW_PLAN_HREF } from "../../app/constants.ts";
import { FILTER_ALL } from "../../shared/constants.ts";
import { JOURNAL_STATUS } from "../journal/data/constants.ts";
import { PLAN_SORT, PLAN_SORTS } from "./list/constants.ts";
import type { PlanFilters } from "./list/types.ts";

import { comparePlanPerformance } from "@liquidation/domain/analytics/plan-performance";
import { indexPlanExecution } from "@liquidation/domain/plans/plan-execution";
import { getPlanPeriod } from "@liquidation/domain/plans/plan-lifecycle";
import { EMPTY_VALUE } from "../../shared/constants.ts";
import { useLocale } from "../../shared/messages.ts";
import { Metric, Panel } from "../../shared/ui/layout.tsx";
import { SelectField } from "../../shared/ui/select-field.tsx";
import { useJournal } from "../journal/data/store.ts";
import { DEFAULT_PLAN_FILTERS } from "./list/constants.ts";
import { filterPlans, planTableGroups } from "./list/filters.ts";
import { usePlanMessages } from "./messages.ts";

import { PlanAnalytics } from "./analytics/plan-analytics.tsx";
import { PlanPerformancePanel } from "./analytics/plan-performance.tsx";
import { PlansTable } from "./list/plans-table.tsx";
import "./plans.css";

export function PlansPage() {
  const { t, format } = useLocale();
  const p = usePlanMessages();
  const { plans, trades, positions, workspace, status, load } = useJournal();
  const [filters, setFilters] = useState<PlanFilters>(DEFAULT_PLAN_FILTERS);
  const ready = status === JOURNAL_STATUS.READY;
  const data = useMemo(
    () =>
      comparePlanPerformance({
        plans,
        trades: trades ?? [],
        positions,
        missedTrades: workspace.missedTrades,
      }),
    [plans, trades, positions, workspace.missedTrades],
  );
  const visiblePlans = useMemo(
    () => filterPlans(plans, filters),
    [plans, filters],
  );
  const execution = useMemo(
    () => indexPlanExecution(plans, trades ?? [], positions),
    [plans, trades, positions],
  );
  const groups = planTableGroups(visiblePlans);
  const past = plans.filter((plan) => getPlanPeriod(plan) === PLAN_PERIOD.PAST);
  const pastResults = past.flatMap(({ id }) => {
    const actual = execution.get(id)?.actual;
    return actual?.closed ? [actual] : [];
  });
  const executed = plans.flatMap(({ id }) => {
    const actual = execution.get(id)?.actual;
    return actual?.closed ? [actual] : [];
  });
  const positivePlans = executed.filter(({ net }) => net > 0).length;
  const profitable = pastResults.filter(({ net }) => net > 0).length;
  const measuredPast = pastResults.filter(({ totalR }) => totalR !== null);
  const pastR = measuredPast.length
    ? measuredPast.reduce((sum, { totalR }) => sum + (totalR ?? 0), 0)
    : null;
  const count = (value: number) => format.integer.format(value);

  const showRate = (rate: number | null) =>
    rate === null ? EMPTY_VALUE : format.percentage.format(rate);

  return (
    <main>
      <div className="page-heading">
        <h1>{p.pageTitle}</h1>
        {ready && (
          <a className="action-link" href={NEW_PLAN_HREF}>
            <span aria-hidden="true">＋</span> {p.create}
          </a>
        )}
      </div>
      {status === JOURNAL_STATUS.ERROR ? (
        <div role="alert">
          <p className="error">{p.loadError}</p>
          <button type="button" onClick={() => void load()}>
            {t.retry}
          </button>
        </div>
      ) : !ready ? (
        <p role="status">{t.loading}</p>
      ) : (
        <div className="layout">
          <section aria-label={p.allPlans} className="plan-overall">
            <div className="metrics plan-metrics">
              <Metric
                label={p.allPlans}
                value={count(plans.length)}
                detail={
                  p.reviewed +
                  " · " +
                  count(data.decided) +
                  " · " +
                  p.awaitingDecision +
                  " " +
                  count(plans.length - data.decided)
                }
              />
              <Metric
                label={p.planWinRate}
                value={showRate(data.allPlanWinRate)}
                detail={
                  count(data.worked) +
                  "/" +
                  count(plans.length) +
                  " · " +
                  p.confirmedPlans
                }
              />
              <Metric
                label={p.reviewedWinRate}
                value={showRate(data.planWinRate)}
                detail={
                  count(data.worked) +
                  "/" +
                  count(data.decided) +
                  " · " +
                  p.reviewedWinRateHint
                }
              />
              <Metric
                label={p.executionWinRate}
                value={showRate(
                  executed.length ? positivePlans / executed.length : null,
                )}
                detail={
                  count(positivePlans) +
                  "/" +
                  count(executed.length) +
                  " · " +
                  p.pastTotals
                }
              />
              <Metric
                label={p.missedWinRate}
                value={showRate(data.missedWinRate)}
                detail={p.assessed + " · " + count(data.assessedMisses)}
              />
            </div>
            <ul className="plan-status-summary" aria-label={p.status}>
              {PLAN_STATUSES.map((value) => (
                <li key={value} className="plan-status" data-status={value}>
                  {p[value]} <strong>{count(data.statuses[value])}</strong>
                </li>
              ))}
            </ul>
          </section>
          <Panel
            title={p.allPlans}
            detail={format.integer.format(visiblePlans.length)}
          >
            <div className="journal-filters">
              <label>
                {p.search}
                <input
                  type="search"
                  placeholder="EURUSD"
                  value={filters.query}
                  onChange={(event) =>
                    setFilters({ ...filters, query: event.target.value })
                  }
                />
              </label>
              <SelectField
                label={p.status}
                value={filters.status}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  setFilters({
                    ...filters,
                    status:
                      PLAN_STATUSES.find((option) => option === value) ??
                      FILTER_ALL,
                  });
                }}
              >
                <option value={FILTER_ALL}>{p.allStatuses}</option>
                {PLAN_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {p[value]}
                  </option>
                ))}
              </SelectField>
              <SelectField
                label={p.order}
                value={filters.sort}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  setFilters({
                    ...filters,
                    sort:
                      PLAN_SORTS.find((option) => option === value) ??
                      PLAN_SORT.LATEST,
                  });
                }}
              >
                {PLAN_SORTS.map((value) => (
                  <option key={value} value={value}>
                    {p[value]}
                  </option>
                ))}
              </SelectField>
              {(filters.query ||
                filters.status !== FILTER_ALL ||
                filters.sort !== PLAN_SORT.LATEST) && (
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setFilters(DEFAULT_PLAN_FILTERS)}
                >
                  {t.resetFilters}
                </button>
              )}
            </div>
            {visiblePlans.length ? (
              <PlansTable groups={groups} execution={execution} />
            ) : (
              <p>{plans.length ? p.noMatches : p.noPlans}</p>
            )}
            {groups.some(({ period }) => period === PLAN_PERIOD.PAST) && (
              <p className="plan-field-hint">
                {p.past} · {count(past.length)} · {p.pastTotals}{" "}
                {count(pastResults.length)} · {p.profitablePlans}{" "}
                {count(profitable)} · {p.totalR}{" "}
                {pastR === null ? EMPTY_VALUE : format.money.format(pastR)}
              </p>
            )}
          </Panel>
          <PlanAnalytics
            plans={plans}
            trades={trades ?? []}
            positions={positions}
            execution={execution}
          />
          <PlanPerformancePanel data={data} />
        </div>
      )}
    </main>
  );
}
