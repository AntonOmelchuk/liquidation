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
import { PAGE_HASHES } from "../../app/constants.ts";
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
import { JournalUnavailable } from "../journal/journal-unavailable.tsx";
import { PlanPerformancePanel } from "../plans/analytics/plan-performance.tsx";
import { createFactorLabels } from "./breakdown/labels.ts";
import { TradeBreakdown } from "./breakdown/trade-breakdown.tsx";
import { TradeBreakdownFilters } from "./breakdown/trade-filters.tsx";
import { useStatisticsMessages } from "./messages.ts";
import { StatisticsSummary } from "./statistics-summary.tsx";
import "./statistics.css";

export function StatisticsPage() {
  const { t, language } = useLocale();
  const s = useStatisticsMessages();
  const { status, trades, plans, positions, playbooks } = useJournal();
  const [dates, setDates] = useState(EMPTY_DATES);
  const [filters, setFilters] = useState<TradeFactorFilters>({});
  const [factor, setFactor] = useState<TradeFactor>(TRADE_FACTOR.INSTRUMENT);
  const [selected, setSelected] = useState<string | null>(null);
  const [unit, setUnit] = useState<ScenarioUnit>(SCENARIO_UNIT.CASH);
  const invalid = invalidDateRange(dates);

  const period = useMemo(() => closingPeriod(dates), [dates]);
  const filtered = useMemo(
    () => filterStatisticTrades(trades ?? [], period, filters),
    [trades, period, filters],
  );
  const metrics = useMemo(() => tradeStatistics(filtered), [filtered]);
  const labelFor = useMemo(
    () => createFactorLabels(trades ?? [], playbooks, LOCALES[language], t, s),
    [language, playbooks, s, t, trades],
  );
  const comparison = useMemo(
    () =>
      comparePlanPerformance(
        { plans, trades: trades ?? [], positions },
        period,
      ),
    [plans, trades, positions, period],
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
            <StatisticsSummary metrics={metrics} />
            <TradeBreakdown
              factor={factor}
              onFactor={(next) => {
                if (next !== factor) setSelected(null);
                setFactor(next);
              }}
              trades={filtered}
              totals={metrics}
              labelFor={labelFor}
              selected={selected}
              onSelect={setSelected}
            />
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
      </div>
    </main>
  );
}
