import {
  PLAN_ANALYTICS_GROUPINGS,
  PLAN_GROUPING,
} from "@liquidation/domain/analytics/constants";
import { summarizePlanGroups } from "@liquidation/domain/analytics/plan-analytics";
import type {
  PlanAnalyticsGrouping,
  PlanAnalyticsRow,
} from "@liquidation/domain/analytics/types";
import { PLAN_STATUSES } from "@liquidation/domain/plans/constants";
import type { PlaybookReference } from "@liquidation/domain/playbooks/types";
import { useId, useMemo, useState } from "react";

import { TRADE_SIDE } from "@liquidation/domain/trades/constants";
import { EMPTY_DATES } from "../../../shared/analytics/constants.ts";
import { invalidDateRange } from "../../../shared/analytics/date-range.ts";
import { FactorButtons } from "../../../shared/analytics/factor-buttons.tsx";
import {
  AnalyticsSelect,
  DateRangeFields,
} from "../../../shared/analytics/filter-fields.tsx";
import { EMPTY_VALUE, LOCALES } from "../../../shared/constants.ts";
import { useLocale } from "../../../shared/messages.ts";
import { Panel } from "../../../shared/ui/layout.tsx";
import { useAllKnownPlaybooks } from "../../journal/data/references.ts";
import { useJournal } from "../../journal/data/store.ts";
import { usePlaybookMessages } from "../../playbooks/messages.ts";
import { usePlanMessages } from "../messages.ts";
import { filterPlanAnalytics, planPlaybookKey } from "./filters.ts";
import { PlanCohortTable } from "./plan-cohort-table.tsx";
import type { PlanAnalyticsFilters, PlanAnalyticsProps } from "./types.ts";

export function PlanAnalytics({
  plans,
  trades,
  positions,
  execution,
}: PlanAnalyticsProps) {
  const { t, language } = useLocale();
  const p = usePlanMessages();
  const b = usePlaybookMessages();
  const playbooks = useAllKnownPlaybooks();
  const missedTrades = useJournal((state) => state.workspace.missedTrades);
  const [grouping, setGrouping] = useState<PlanAnalyticsGrouping>(
    PLAN_GROUPING.COMBINED,
  );
  const [filters, setFilters] = useState<PlanAnalyticsFilters>({
    dates: EMPTY_DATES,
  });
  const [selected, setSelected] = useState<string | null>(null);
  const hintId = useId();
  const { from, through } = filters.dates;
  const invalid = invalidDateRange(filters.dates);
  const matching = useMemo(
    () => (invalid ? [] : filterPlanAnalytics(plans, filters)),
    [filters, invalid, plans],
  );
  const groups = useMemo(
    () =>
      summarizePlanGroups(
        { plans: matching, trades, positions, missedTrades },
        grouping,
      ),
    [grouping, matching, positions, trades, missedTrades],
  );
  const options = useMemo(() => {
    const names = new Map(playbooks.map(({ id, title }) => [id, title]));
    const showBook = (reference?: PlaybookReference) =>
      reference
        ? `${names.get(reference.id) ?? b.missing} · v${reference.version}`
        : b.none;
    const compare = new Intl.Collator(LOCALES[language], { numeric: true })
      .compare;
    const symbols = [...new Set(plans.map(({ setup }) => setup.symbol))]
      .sort(compare)
      .map((key) => ({ key, label: key }));
    const books = [
      ...new Map(
        plans.map((plan) => [
          planPlaybookKey(plan),
          showBook(plan.setup.playbook),
        ]),
      ),
    ]
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) => compare(a.label, b.label));
    return { showBook, symbols, books };
  }, [b.missing, b.none, language, plans, playbooks]);
  const activeFilters = Boolean(
    from ||
    through ||
    filters.instrument ||
    filters.playbook !== undefined ||
    filters.status ||
    filters.side,
  );
  const groupLabels = {
    [PLAN_GROUPING.COMBINED]: p.analyticsCombined,
    [PLAN_GROUPING.INSTRUMENT]: p.analyticsInstrument,
    [PLAN_GROUPING.PLAYBOOK]: p.analyticsPlaybook,
    [PLAN_GROUPING.SIDE]: t.side,
  };

  function label(row: PlanAnalyticsRow) {
    if (row.direction) return t[row.direction];
    if (grouping === PLAN_GROUPING.INSTRUMENT)
      return row.instrument ?? EMPTY_VALUE;
    const book = options.showBook(row.playbook);
    return row.instrument ? `${row.instrument} · ${book}` : book;
  }

  function update<Key extends keyof PlanAnalyticsFilters>(
    key: Key,
    value: PlanAnalyticsFilters[Key],
  ) {
    setFilters((current) => ({ ...current, [key]: value }));
    setSelected(null);
  }

  return (
    <Panel
      title={p.analyticsTitle}
      detail={
        activeFilters && (
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setFilters({ dates: EMPTY_DATES });
              setSelected(null);
            }}
          >
            {t.resetFilters}
          </button>
        )
      }
    >
      <div className="analytics-filter-grid">
        <DateRangeFields
          range={filters.dates}
          fromLabel={p.analyticsFrom}
          throughLabel={p.analyticsThrough}
          hintId={hintId}
          invalid={invalid}
          onChange={(dates) => update("dates", dates)}
        />
        <AnalyticsSelect
          label={p.analyticsInstrument}
          all={p.analyticsAllInstruments}
          options={options.symbols}
          value={filters.instrument}
          onChange={(key) => update("instrument", key)}
        />
        <AnalyticsSelect
          label={p.analyticsPlaybook}
          all={p.analyticsAllPlaybooks}
          options={options.books}
          value={filters.playbook}
          onChange={(key) => update("playbook", key)}
        />
        <AnalyticsSelect
          label={p.status}
          all={p.allStatuses}
          value={filters.status}
          options={PLAN_STATUSES.map((key) => ({ key, label: p[key] }))}
          onChange={(key) =>
            update(
              "status",
              PLAN_STATUSES.find((status) => status === key),
            )
          }
        />
        <AnalyticsSelect
          label={t.side}
          all={t.allSides}
          value={filters.side}
          options={Object.values(TRADE_SIDE).map((key) => ({
            key,
            label: t[key],
          }))}
          onChange={(key) =>
            update(
              "side",
              Object.values(TRADE_SIDE).find((side) => side === key),
            )
          }
        />
      </div>
      <p id={hintId} className="analytics-hint">
        {p.analyticsDateHint}
      </p>
      {invalid ? (
        <p className="error" role="alert">
          {t.invalidDateRange}
        </p>
      ) : (
        <>
          <div className="plan-analysis-factors">
            <FactorButtons
              label={p.analyticsGrouping}
              value={grouping}
              onChange={(next) => {
                setGrouping(next);
                setSelected(null);
              }}
              options={PLAN_ANALYTICS_GROUPINGS.map((key) => ({
                key,
                label: groupLabels[key],
              }))}
            />
          </div>
          {groups.length ? (
            <PlanCohortTable
              key={grouping}
              rows={groups}
              heading={groupLabels[grouping]}
              selected={selected}
              onSelect={setSelected}
              label={label}
              execution={execution}
            />
          ) : (
            <p role="status">{plans.length ? p.noMatches : p.noPlans}</p>
          )}
        </>
      )}
    </Panel>
  );
}
