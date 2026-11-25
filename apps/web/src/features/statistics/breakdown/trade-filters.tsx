import { TRADE_FACTOR } from "@liquidation/domain/analytics/constants";
import { tradeFactorKeys } from "@liquidation/domain/analytics/trade-factors";
import type { TradeFactor } from "@liquidation/domain/analytics/types";
import { useId, useMemo } from "react";
import {
  AnalyticsSelect,
  DateRangeFields,
} from "../../../shared/analytics/filter-fields.tsx";
import type { AnalyticsOption } from "../../../shared/analytics/types.ts";
import { LOCALES } from "../../../shared/constants.ts";
import { useLocale } from "../../../shared/messages.ts";
import { InfoTip } from "../../../shared/ui/info-tip.tsx";
import { Panel } from "../../../shared/ui/layout.tsx";
import { useAccountOptions } from "../../accounts/account-options.ts";
import { useAccountMessages } from "../../accounts/messages.ts";
import {
  CHRONOLOGICAL_FACTORS,
  FACTOR_SECTIONS,
  KNOWN_FACTOR_KEYS,
} from "../constants.ts";
import { useStatisticsHelp } from "../help-messages.ts";
import { useStatisticsMessages } from "../messages.ts";
import type { TradeBreakdownFiltersProps } from "../types.ts";

export function TradeBreakdownFilters({
  trades,
  dates,
  filters,
  invalidDates,
  labelFor,
  onDates,
  onFilter,
  onReset,
}: TradeBreakdownFiltersProps) {
  const s = useStatisticsMessages();
  const { factors: help } = useStatisticsHelp();
  const { t, language } = useLocale();
  const hint = useId();
  const accountOptions = useAccountOptions();
  const accounts = useAccountMessages();
  const options = useMemo(() => {
    const compare = new Intl.Collator(LOCALES[language], { numeric: true })
      .compare;
    const entries = new Map<TradeFactor, AnalyticsOption[]>();
    for (const factor of Object.values(FACTOR_SECTIONS).flat()) {
      const keys = new Set([
        ...(KNOWN_FACTOR_KEYS[factor] ?? []),
        ...trades.flatMap((trade) => tradeFactorKeys(trade, factor)),
      ]);
      const rows = [...keys].map((key) => ({
        key,
        label: labelFor(factor, key),
      }));
      rows.sort((a, b) => {
        if (!a.key || !b.key) return Number(!a.key) - Number(!b.key);
        return CHRONOLOGICAL_FACTORS.has(factor)
          ? compare(a.key, b.key)
          : compare(a.label, b.label);
      });
      entries.set(factor, rows);
    }
    return entries;
  }, [labelFor, language, trades]);

  const activeFactors = Object.values(FACTOR_SECTIONS)
    .flat()
    .filter((factor) => filters[factor] !== undefined);
  const active = Boolean(dates.from || dates.through || activeFactors.length);

  function renderFilter(factor: TradeFactor) {
    return (
      <AnalyticsSelect
        key={factor}
        label={s[factor]}
        title={help[factor]}
        all={factor === TRADE_FACTOR.ACCOUNT ? accounts.all : s.allValues}
        value={filters[factor]}
        options={
          factor === TRADE_FACTOR.ACCOUNT
            ? accountOptions
            : (options.get(factor) ?? [])
        }
        onChange={(key) => onFilter(factor, key)}
      />
    );
  }

  return (
    <Panel
      title={s.filters}
      detail={
        <div className="statistics-filter-actions">
          <InfoTip label={s.help} text={s.filterHint} />
          {active && (
            <button type="button" className="secondary" onClick={onReset}>
              {t.resetFilters}
            </button>
          )}
        </div>
      }
    >
      <div className="statistics-filter-primary">
        <span className="statistics-filter-label">{s.dateRange}</span>
        <div className="analytics-filter-grid">
          <DateRangeFields
            range={dates}
            fromLabel={t.fromDate}
            throughLabel={t.toDate}
            invalid={invalidDates}
            hintId={hint}
            onChange={onDates}
          />
          {renderFilter(TRADE_FACTOR.ACCOUNT)}
        </div>
      </div>
      <div className="statistics-filter-categories">
        {Object.entries(FACTOR_SECTIONS).map(([section, factors]) => {
          const categoryFactors = factors.filter(
            (factor) => factor !== TRADE_FACTOR.ACCOUNT,
          );
          const count = categoryFactors.filter(
            (factor) => filters[factor] !== undefined,
          ).length;
          return (
            <details key={section} className="statistics-filter-category">
              <summary>
                {s[section as keyof typeof FACTOR_SECTIONS]}
                {count > 0 && (
                  <span className="statistics-filter-count">{count}</span>
                )}
              </summary>
              <div className="analytics-filter-grid">
                {categoryFactors.map(renderFilter)}
              </div>
            </details>
          );
        })}
      </div>
      <div className="statistics-active-filters" aria-live="polite">
        <span>{active ? s.activeFilters : s.emptyFilters}</span>
        {dates.from && (
          <button
            className="filter-chip"
            type="button"
            onClick={() => onDates({ ...dates, from: "" })}
            aria-label={s.removeFilter + " · " + t.fromDate}
          >
            {t.fromDate} · {dates.from}
            <span aria-hidden="true">×</span>
          </button>
        )}
        {dates.through && (
          <button
            className="filter-chip"
            type="button"
            onClick={() => onDates({ ...dates, through: "" })}
            aria-label={s.removeFilter + " · " + t.toDate}
          >
            {t.toDate} · {dates.through}
            <span aria-hidden="true">×</span>
          </button>
        )}
        {activeFactors.map((factor) => {
          const label =
            s[factor] + " · " + labelFor(factor, filters[factor] ?? "");
          return (
            <button
              className="filter-chip"
              type="button"
              key={factor}
              onClick={() => onFilter(factor, undefined)}
              aria-label={s.removeFilter + " · " + label}
            >
              {label}
              <span aria-hidden="true">×</span>
            </button>
          );
        })}
      </div>
      <p id={hint} className="analytics-hint">
        {s.periodHint}
      </p>
      {invalidDates && (
        <p role="alert" className="error">
          {t.invalidDateRange}
        </p>
      )}
    </Panel>
  );
}
