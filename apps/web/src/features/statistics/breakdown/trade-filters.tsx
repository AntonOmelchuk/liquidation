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
import { Panel } from "../../../shared/ui/layout.tsx";
import {
  CHRONOLOGICAL_FACTORS,
  EXTRA_FACTORS,
  PRIMARY_FACTORS,
} from "../constants.ts";
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
  const { t, language } = useLocale();
  const hint = useId();
  const options = useMemo(() => {
    const compare = new Intl.Collator(LOCALES[language], { numeric: true })
      .compare;
    const entries = new Map<TradeFactor, AnalyticsOption[]>();
    for (const factor of [...PRIMARY_FACTORS, ...EXTRA_FACTORS]) {
      const keys = new Set(
        trades.flatMap((trade) => tradeFactorKeys(trade, factor)),
      );
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
  const extraActive = EXTRA_FACTORS.filter(
    (factor) => filters[factor] !== undefined,
  ).length;
  const active =
    dates.from ||
    dates.through ||
    Object.values(filters).some((key) => key !== undefined);

  function renderFilter(factor: TradeFactor) {
    return (
      <AnalyticsSelect
        key={factor}
        label={s[factor]}
        all={s.allValues}
        value={filters[factor]}
        options={options.get(factor) ?? []}
        onChange={(key) => onFilter(factor, key)}
      />
    );
  }

  return (
    <Panel
      title={s.filters}
      detail={
        active && (
          <button type="button" className="secondary" onClick={onReset}>
            {t.resetFilters}
          </button>
        )
      }
    >
      <div className="analytics-filter-grid">
        <DateRangeFields
          range={dates}
          fromLabel={t.fromDate}
          throughLabel={t.toDate}
          invalid={invalidDates}
          hintId={hint}
          onChange={onDates}
        />
        {PRIMARY_FACTORS.map(renderFilter)}
      </div>
      <details className="analytics-more">
        <summary>
          {s.moreFilters}
          {extraActive > 0 && ` · ${extraActive}`}
        </summary>
        <div className="analytics-filter-grid">
          {EXTRA_FACTORS.map(renderFilter)}
        </div>
      </details>
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
