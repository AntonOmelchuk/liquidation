import { accountPerformance } from "@liquidation/domain/accounts/performance";
import {
  SCENARIO_UNIT,
  TRADE_FACTOR,
} from "@liquidation/domain/analytics/constants";
import { comparePlanPerformance } from "@liquidation/domain/analytics/plan-performance";
import { filterStatisticTrades } from "@liquidation/domain/analytics/trade-factors";
import { tradeStatistics } from "@liquidation/domain/analytics/trade-statistics";
import type {
  ScenarioUnit,
  TradeFactor,
  TradeFactorFilters,
} from "@liquidation/domain/analytics/types";
import { useMemo, useState } from "react";
import { FactorButtons } from "../../shared/analytics/factor-buttons.tsx";
import { PAGE, PAGE_HASHES } from "../../app/constants.ts";
import { JOURNAL_STATUS } from "../journal/data/constants.ts";

import { EMPTY_DATES } from "../../shared/analytics/constants.ts";
import {
  closingPeriod,
  invalidDateRange,
} from "../../shared/analytics/date-range.ts";
import { LOCALES } from "../../shared/constants.ts";
import { useLocale } from "../../shared/messages.ts";
import { SelectField } from "../../shared/ui/select-field.tsx";
import { useJournal } from "../journal/data/store.ts";
import { useAccountOptions } from "../accounts/account-options.ts";
import { useAccountSource } from "../accounts/use-account-source.ts";
import { useAllKnownPlaybooks } from "../journal/data/references.ts";
import { JournalUnavailable } from "../journal/journal-unavailable.tsx";
import { PlanPerformancePanel } from "../plans/analytics/plan-performance.tsx";
import { createFactorLabels } from "./breakdown/labels.ts";
import { TradeBreakdown } from "./breakdown/trade-breakdown.tsx";
import { TradeBreakdownFilters } from "./breakdown/trade-filters.tsx";
import { StatisticsOverview } from "./breakdown/statistics-overview.tsx";
import { InsightReport } from "./insights/insight-report.tsx";
import { MetricGlossary } from "./metric-glossary.tsx";
import { STATISTICS_VIEW } from "./constants.ts";
import type {
  AccountBalance,
  FactorSelection,
  StatisticsView,
} from "./types.ts";
import { useStatisticsMessages } from "./messages.ts";
import { RiskAnalysis } from "./risk-analysis.tsx";
import { PeriodBreakdown } from "./period-breakdown.tsx";
import { EvidenceStatistics } from "./evidence-statistics.tsx";
import { useAdvancedStatisticsMessages } from "./advanced-messages.ts";
import { ComparisonTable } from "../workspace/reports/comparison-table.tsx";
import { StatisticsTradesTable } from "./statistics-trades-table.tsx";
import { usePlanningMessages } from "../workspace/planning/messages.ts";
import { StatisticsSummary } from "./statistics-summary.tsx";

export function StatisticsPage({ account }: { account?: string }) {
  const { t, language, format } = useLocale();
  const s = useStatisticsMessages();
  const a = useAdvancedStatisticsMessages();
  const planning = usePlanningMessages();
  const { status, trades, plans, positions, workspace, accounts } =
    useJournal();
  const playbooks = useAllKnownPlaybooks();
  const accountOptions = useAccountOptions();
  const accountSource = useAccountSource();
  const [dates, setDates] = useState(EMPTY_DATES);
  const [filters, setFilters] = useState<TradeFactorFilters>({ account });
  const [factor, setFactor] = useState<TradeFactor>(TRADE_FACTOR.INSTRUMENT);
  const [view, setView] = useState<StatisticsView>(STATISTICS_VIEW.OVERVIEW);
  const [selected, setSelected] = useState<FactorSelection | null>(null);
  const [unit, setUnit] = useState<ScenarioUnit>(SCENARIO_UNIT.CASH);
  const invalid = invalidDateRange(dates);

  const period = useMemo(() => closingPeriod(dates), [dates]);
  const filtered = useMemo(
    () => filterStatisticTrades(trades ?? [], period, filters),
    [trades, period, filters],
  );
  const outside = useMemo(() => {
    if (!trades || filtered.length === trades.length) return [];
    const selectedIds = new Set(filtered.map((trade) => trade.id));
    return trades.filter((trade) => !selectedIds.has(trade.id));
  }, [trades, filtered]);
  const metrics = useMemo(() => tradeStatistics(filtered), [filtered]);
  const labelFor = useMemo(
    () =>
      createFactorLabels(
        trades ?? [],
        playbooks,
        LOCALES[language],
        t,
        s,
        accountOptions,
      ),
    [accountOptions, language, playbooks, s, t, trades],
  );
  const balances = useMemo(
    () =>
      new Map<string, AccountBalance>(
        accounts.map((record) => [
          record.id,
          {
            openingBalance: record.startingBalance,
            balance: accountPerformance(record, accountSource).balance,
          },
        ]),
      ),
    [accounts, accountSource],
  );
  const comparison = useMemo(
    () =>
      comparePlanPerformance(
        {
          plans,
          trades: trades ?? [],
          positions,
          missedTrades: workspace.missedTrades,
        },
        period,
      ),
    [plans, trades, positions, period, workspace.missedTrades],
  );

  if (status !== JOURNAL_STATUS.READY) {
    return (
      <JournalUnavailable
        backHref={PAGE_HASHES.journal}
        backLabel={t.backJournal}
        missing={t.noTrades}
      />
    );
  }

  return (
    <main className="statistics-page">
      <header className="page-heading">
        <h1>{s.title}</h1>
        <div className="workspace-actions">
          <a
            className="action-link secondary"
            href={PAGE_HASHES[PAGE.MISSED_TRADES]}
          >
            {planning.missedAnalytics}
          </a>
          <a className="action-link secondary" href={PAGE_HASHES.mistakes}>
            {s.mistakesPage}
          </a>
          <a className="action-link secondary" href={PAGE_HASHES.guide}>
            {s.help}
          </a>
        </div>
      </header>
      <div className="layout">
        <TradeBreakdownFilters
          trades={trades ?? []}
          dates={dates}
          filters={filters}
          invalidDates={invalid}
          labelFor={labelFor}
          onDates={(range) => {
            setDates(range);
            setSelected(null);
          }}
          onFilter={(key, value) => {
            setFilters((previous) => ({ ...previous, [key]: value }));
            setSelected(null);
          }}
          onReset={() => {
            setDates(EMPTY_DATES);
            setFilters({});
            setSelected(null);
          }}
        />
        {!invalid && (
          <>
            <StatisticsSummary metrics={metrics} trades={filtered} />
            <div className="statistics-view-toolbar">
              <FactorButtons
                label={s.viewMode}
                options={Object.values(STATISTICS_VIEW).map((key) => ({
                  key,
                  label: s[key],
                }))}
                value={view}
                onChange={(next) => {
                  setView(next);
                  setSelected(null);
                }}
              />
              <span className="subdued">
                {format.integer.format(metrics.count)} · {s.totals}
              </span>
            </div>
            {view === STATISTICS_VIEW.OVERVIEW ? (
              <>
                <p className="analytics-hint statistics-overview-hint">
                  {s.overviewHint}
                </p>
                <StatisticsOverview
                  trades={filtered}
                  totals={metrics}
                  filters={filters}
                  balances={balances}
                  labelFor={labelFor}
                  selected={selected}
                  onSelect={setSelected}
                />
              </>
            ) : view === STATISTICS_VIEW.TRADES ? (
              <StatisticsTradesTable
                trades={filtered}
                labelFor={labelFor}
                playbooks={playbooks}
              />
            ) : view === STATISTICS_VIEW.INSIGHTS ? (
              <InsightReport trades={filtered} labelFor={labelFor} />
            ) : (
              <TradeBreakdown
                factor={factor}
                onFactor={(next) => {
                  setSelected(null);
                  setFactor(next);
                }}
                trades={filtered}
                totals={metrics}
                labelFor={labelFor}
                selected={selected?.factor === factor ? selected.key : null}
                onSelect={(key) =>
                  setSelected(key === null ? null : { factor, key })
                }
              />
            )}
            {view !== STATISTICS_VIEW.TRADES && (
              <>
                <details className="panel analytics-more statistics-glossary">
                  <summary>{s.metricDefinitions}</summary>
                  <MetricGlossary />
                </details>
                {filtered.length > 0 && outside.length > 0 && (
                  <details className="panel analytics-more">
                    <summary>{a.comparison}</summary>
                    <ComparisonTable
                      current={filtered}
                      previous={outside}
                      currentLabel={a.selection}
                      previousLabel={a.outsideSelection}
                      showChange
                    />
                  </details>
                )}
                <RiskAnalysis trades={filtered} />
                <PeriodBreakdown trades={filtered} />
                <EvidenceStatistics trades={filtered} />
                <section className="statistics-scenario">
                  <div className="statistics-scenario-controls">
                    <p className="analytics-hint">{s.comparisonScope}</p>
                    <SelectField
                      label={s.compareUnit}
                      value={unit}
                      onChange={(event) =>
                        setUnit(
                          event.currentTarget.value === SCENARIO_UNIT.R
                            ? SCENARIO_UNIT.R
                            : SCENARIO_UNIT.CASH,
                        )
                      }
                    >
                      <option value={SCENARIO_UNIT.CASH}>{s.unitCash}</option>
                      <option value={SCENARIO_UNIT.R}>{s.unitR}</option>
                    </SelectField>
                  </div>
                  <PlanPerformancePanel data={comparison} unit={unit} />
                </section>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
