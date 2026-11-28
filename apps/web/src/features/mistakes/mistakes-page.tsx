import {
  MISTAKE_PERIOD,
  TRADE_FACTOR,
} from "@liquidation/domain/analytics/constants";
import {
  mistakeAnalytics,
  mistakePeriods,
} from "@liquidation/domain/analytics/mistake-analytics";
import { filterStatisticTrades } from "@liquidation/domain/analytics/trade-factors";
import { calendarDate } from "@liquidation/domain/workspace/period";
import { useId, useMemo, useState } from "react";
import { PAGE_HASHES } from "../../app/constants.ts";
import { EMPTY_DATES } from "../../shared/analytics/constants.ts";
import {
  closingPeriod,
  invalidDateRange,
} from "../../shared/analytics/date-range.ts";
import {
  AnalyticsSelect,
  DateRangeFields,
} from "../../shared/analytics/filter-fields.tsx";
import { EMPTY_VALUE, LOCALES } from "../../shared/constants.ts";
import { capitalizeFirst } from "../../shared/format.ts";
import { useLocale } from "../../shared/messages.ts";
import { Panel } from "../../shared/ui/layout.tsx";
import { MetricBar } from "../../shared/ui/metric-bar.tsx";
import { MetricCard, MetricGrid } from "../../shared/ui/metric-card.tsx";
import { METRIC_TONE } from "../../shared/ui/metric-constants.ts";
import { useAccountOptions } from "../accounts/account-options.ts";
import { useAccountMessages } from "../accounts/messages.ts";
import { JOURNAL_STATUS } from "../journal/data/constants.ts";
import { useJournal } from "../journal/data/store.ts";
import { TradeTable } from "../journal/records/trade-table.tsx";
import { JournalUnavailable } from "../journal/journal-unavailable.tsx";
import { mistakeLabel, useMistakeMessages } from "./messages.ts";
import { MistakeSummaryTable } from "./mistake-summary-table.tsx";
import { MistakePeriodTable } from "./mistake-period-table.tsx";
import "./mistakes.css";

export default function MistakesPage() {
  const { t, format, language } = useLocale();
  const m = useMistakeMessages();
  const a = useAccountMessages();
  const status = useJournal((state) => state.status);
  const trades = useJournal((state) => state.trades);
  const options = useAccountOptions();
  const [dates, setDates] = useState(EMPTY_DATES);
  const [account, setAccount] = useState<string>();
  const [focus, setFocus] = useState<string>();
  const hintId = useId();
  const invalid = invalidDateRange(dates);
  const filtered = useMemo(
    () =>
      invalid
        ? []
        : filterStatisticTrades(trades ?? [], closingPeriod(dates), {
            [TRADE_FACTOR.ACCOUNT]: account,
          }),
    [account, dates, invalid, trades],
  );
  const report = useMemo(() => mistakeAnalytics(filtered), [filtered]);
  const coverage = report.closed ? report.reviewed / report.closed : null;
  const affected = report.reviewed ? report.affected / report.reviewed : null;
  const focused = report.rows.find((row) => row.key === focus);
  const periods = useMemo(
    () => ({
      day: mistakePeriods(filtered, MISTAKE_PERIOD.DAY, focused?.key),
      month: mistakePeriods(filtered, MISTAKE_PERIOD.MONTH, focused?.key),
      weekday: mistakePeriods(filtered, MISTAKE_PERIOD.WEEKDAY, focused?.key),
    }),
    [filtered, focused?.key],
  );
  const locale = LOCALES[language];
  const month = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const weekday = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    timeZone: "UTC",
  });
  const monthLabel = (key: string) =>
    capitalizeFirst(month.format(calendarDate(key + "-01")), locale);
  const weekdayLabel = (key: string) =>
    capitalizeFirst(
      weekday.format(new Date(Date.UTC(2024, 0, Number(key)))),
      locale,
    );
  const percent = (value: number | null) =>
    value === null ? EMPTY_VALUE : format.percentage.format(value);
  if (status !== JOURNAL_STATUS.READY)
    return (
      <JournalUnavailable
        backHref={PAGE_HASHES.journal}
        backLabel={t.backJournal}
        missing={t.noTrades}
      />
    );
  return (
    <main className="mistakes-page">
      <header className="page-heading">
        <h1>{m.title}</h1>
        <a className="action-link secondary" href={PAGE_HASHES.journal}>
          {t.backJournal}
        </a>
      </header>
      <div className="layout">
        <Panel
          title={t.statistics}
          detail={
            (dates.from || dates.through || account !== undefined) && (
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setDates(EMPTY_DATES);
                  setAccount(undefined);
                  setFocus(undefined);
                }}
              >
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
              invalid={invalid}
              hintId={hintId}
              onChange={(range) => {
                setDates(range);
                setFocus(undefined);
              }}
            />
            <AnalyticsSelect
              label={t.account}
              all={a.all}
              options={options}
              value={account}
              onChange={(next) => {
                setAccount(next);
                setFocus(undefined);
              }}
            />
          </div>
          <p className="analytics-hint" id={hintId}>
            {m.dateHint}
          </p>
          {invalid && (
            <p className="error" role="alert">
              {t.invalidDateRange}
            </p>
          )}
        </Panel>
        {!invalid && (
          <>
            <MetricGrid label={m.title}>
              <MetricCard
                label={m.coverage}
                value={report.reviewed + "/" + report.closed}
                icon="CHECKLIST"
                detail={
                  coverage !== null && (
                    <>
                      <span>{percent(coverage)}</span>
                      <MetricBar
                        segments={[
                          { tone: METRIC_TONE.ACCENT, ratio: coverage },
                        ]}
                      />
                    </>
                  )
                }
              />
              <MetricCard
                label={m.affected}
                value={format.integer.format(report.affected)}
                icon="ACTIVITY"
                tone={report.affected ? METRIC_TONE.NEGATIVE : undefined}
                detail={
                  affected !== null && (
                    <>
                      <span>{percent(affected)}</span>
                      <MetricBar
                        segments={[
                          { tone: METRIC_TONE.NEGATIVE, ratio: affected },
                        ]}
                      />
                    </>
                  )
                }
              />
              <MetricCard
                label={m.count}
                value={format.integer.format(report.occurrences)}
                icon="LAYERS"
                tone={METRIC_TONE.NEUTRAL}
              />
              <MetricCard
                label={m.criticalTrades}
                value={format.integer.format(report.critical)}
                icon="WARNING"
                tone={report.critical ? METRIC_TONE.NEGATIVE : undefined}
                detail={m.critical + " · " + report.criticalOccurrences}
              />
              <MetricCard
                label={m.recurrence}
                value={format.integer.format(report.recurring)}
                icon="REPEAT"
                tone={report.recurring ? METRIC_TONE.CAUTION : undefined}
              />
            </MetricGrid>
            <Panel title={m.summary}>
              <p className="analytics-hint">{m.metricHint}</p>
              <MistakeSummaryTable
                rows={report.rows}
                focus={focused?.key}
                onFocus={setFocus}
              />
              <p className="analytics-hint">
                {m.sampleHint} ({report.previousCount} → {report.recentCount})
              </p>
            </Panel>
            <Panel
              title={m.trendTitle}
              detail={
                <AnalyticsSelect
                  label={m.selection}
                  all={m.allTags}
                  value={focused?.key}
                  options={report.rows.map((row) => ({
                    key: row.key,
                    label: mistakeLabel(row.label, language),
                  }))}
                  onChange={setFocus}
                />
              }
            >
              <p className="analytics-hint">{m.focusHint}</p>
              {periods.month.length ? (
                <div
                  className="mistake-trend-bars"
                  role="list"
                  aria-label={m.trendTitle}
                >
                  {periods.month.toReversed().map((row) => (
                    <div
                      className="mistake-trend-row"
                      key={row.key}
                      role="listitem"
                    >
                      <strong>{monthLabel(row.key)}</strong>
                      <div
                        className="mistake-trend-track"
                        title={row.affected + "/" + row.reviewed}
                        aria-hidden="true"
                      >
                        <span style={{ width: (row.rate ?? 0) * 100 + "%" }} />
                      </div>
                      <span>{percent(row.rate)}</span>
                      <small>
                        {row.affected}/{row.reviewed}
                      </small>
                    </div>
                  ))}
                </div>
              ) : (
                <p>{m.noHistory}</p>
              )}
            </Panel>
            {focused && (
              <Panel
                title={
                  m.inspect + " · " + mistakeLabel(focused.label, language)
                }
                detail={
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setFocus(undefined)}
                  >
                    {t.close}
                  </button>
                }
              >
                <TradeTable trades={focused.records} />
              </Panel>
            )}
            <div className="mistake-period-grid">
              <MistakePeriodTable
                key={"month-" + (focused?.key ?? "")}
                title={m.byMonth}
                heading={m.month}
                rows={periods.month}
                label={monthLabel}
              />
              <MistakePeriodTable
                key={"weekday-" + (focused?.key ?? "")}
                title={m.byWeekday}
                heading={m.weekday}
                rows={periods.weekday}
                label={weekdayLabel}
                chronological
              />
            </div>
            <MistakePeriodTable
              key={"day-" + (focused?.key ?? "")}
              title={m.byDay}
              heading={m.day}
              rows={periods.day}
              label={(key) => format.day.format(calendarDate(key))}
            />
          </>
        )}
      </div>
    </main>
  );
}
