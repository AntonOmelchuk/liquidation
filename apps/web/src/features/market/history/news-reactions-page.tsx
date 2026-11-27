import {
  buildReleaseSeries,
  isLegacyYuanReaction,
  normalizeReleaseName,
} from "@liquidation/domain/market/release-history";
import { useId, useMemo, useState } from "react";
import { PAGE_HASHES } from "../../../app/constants.ts";
import { EMPTY_DATES } from "../../../shared/analytics/constants.ts";
import {
  closingPeriod,
  invalidDateRange,
} from "../../../shared/analytics/date-range.ts";
import {
  AnalyticsSelect,
  DateRangeFields,
} from "../../../shared/analytics/filter-fields.tsx";
import { useLocale } from "../../../shared/messages.ts";
import { CheckboxField } from "../../../shared/ui/checkbox-field.tsx";
import { Panel } from "../../../shared/ui/layout.tsx";
import { useReleaseHistory } from "../feeds.ts";
import { useMarketMessages } from "../messages.ts";
import { EMPTY_RELEASE_HISTORY } from "./constants.ts";
import { useNewsReactionMessages } from "./messages.ts";
import { NewsSeriesTable } from "./news-series-table.tsx";
import "./news-reactions.css";

export default function NewsReactionsPage() {
  const m = useNewsReactionMessages();
  const market = useMarketMessages();
  const { t, format } = useLocale();
  const result = useReleaseHistory();
  const rows = result?.data ?? EMPTY_RELEASE_HISTORY;
  const [search, setSearch] = useState("");
  const [currency, setCurrency] = useState<string>();
  const [symbol, setSymbol] = useState<string>();
  const [dates, setDates] = useState(EMPTY_DATES);
  const [includeLegacy, setIncludeLegacy] = useState(false);
  const hintId = useId();
  const invalid = invalidDateRange(dates);
  const standard = useMemo(
    () => rows.filter((row) => !isLegacyYuanReaction(row)),
    [rows],
  );
  const eligible = includeLegacy ? rows : standard;
  const hasLegacy = standard.length < rows.length;
  const choices = useMemo(
    () => ({
      currencies: [...new Set(eligible.map(({ event }) => event.currency))]
        .sort()
        .map((key) => ({ key, label: key })),
      symbols: [...new Set(eligible.map(({ reaction }) => reaction.symbol))]
        .sort()
        .map((key) => ({ key, label: key })),
    }),
    [eligible],
  );
  const series = useMemo(() => {
    if (invalid) return [];
    const { start, end } = closingPeriod(dates);
    const query = normalizeReleaseName(search);
    return buildReleaseSeries(
      eligible.filter(({ event, reaction }) => {
        const release = Date.parse(event.at);
        return (
          release >= start &&
          release < end &&
          (!currency || event.currency === currency) &&
          (!symbol || reaction.symbol === symbol) &&
          normalizeReleaseName(event.name).includes(query)
        );
      }),
    );
  }, [eligible, dates, search, currency, symbol, invalid]);
  const filtered =
    search ||
    currency ||
    symbol ||
    dates.from ||
    dates.through ||
    includeLegacy;

  return (
    <main className="news-reactions-page">
      <header className="page-heading">
        <h1>{m.title}</h1>
        <a className="action-link secondary" href={PAGE_HASHES.journal}>
          {t.backJournal}
        </a>
      </header>
      <Panel
        title={m.archive}
        detail={
          series.length > 0 && m.series(format.integer.format(series.length))
        }
      >
        <p className="news-reactions-hint">{m.collection}</p>
        {rows.length > 0 && (
          <div className="news-reactions-filters">
            <label>
              {m.search}
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.currentTarget.value)}
              />
            </label>
            <AnalyticsSelect
              label={market.currency}
              all={m.allCurrencies}
              options={choices.currencies}
              value={currency}
              onChange={setCurrency}
            />
            <AnalyticsSelect
              label={market.reactionSymbol}
              all={m.allInstruments}
              options={choices.symbols}
              value={symbol}
              onChange={setSymbol}
            />
            <DateRangeFields
              range={dates}
              fromLabel={m.from}
              throughLabel={m.through}
              invalid={invalid}
              hintId={invalid ? hintId : undefined}
              onChange={setDates}
            />
            {filtered && (
              <button
                className="secondary"
                type="button"
                onClick={() => {
                  setSearch("");
                  setCurrency(undefined);
                  setSymbol(undefined);
                  setDates(EMPTY_DATES);
                  setIncludeLegacy(false);
                }}
              >
                {t.resetFilters}
              </button>
            )}
          </div>
        )}
        {hasLegacy && (
          <CheckboxField
            checked={includeLegacy}
            onChange={(event) => {
              const checked = event.currentTarget.checked;
              if (!checked) {
                if (!standard.some(({ event }) => event.currency === currency))
                  setCurrency(undefined);
                if (
                  !standard.some(({ reaction }) => reaction.symbol === symbol)
                )
                  setSymbol(undefined);
              }
              setIncludeLegacy(checked);
            }}
          >
            {m.legacyYuan}
          </CheckboxField>
        )}
        {!result && <p role="status">{t.loading}</p>}
        {result?.failed && (
          <p className="error" role="status">
            {m.error}
          </p>
        )}
        {invalid && (
          <p className="error" id={hintId}>
            {t.invalidDateRange}
          </p>
        )}
        {series.length ? (
          <>
            <NewsSeriesTable series={series} />
            <p className="news-reactions-hint">{m.methodology}</p>
          </>
        ) : (
          result &&
          !result.failed &&
          !invalid && (
            <p role="status">
              {eligible.length
                ? m.noMatches
                : hasLegacy
                  ? m.legacyOnly
                  : m.empty}
            </p>
          )
        )}
      </Panel>
    </main>
  );
}
