import { DateText } from "../../../shared/ui/date-text.tsx";
import {
  FORECAST_RESULT,
  OFFSHORE_YUAN_PAIR,
  PERCENT_READING_UNIT,
  RELEASE_REACTION_MINUTES,
} from "@liquidation/domain/market/constants";
import { releaseObservationKey } from "@liquidation/domain/market/release-history";
import {
  compareReleaseObservations,
  summarizeForecastReactions,
} from "@liquidation/domain/market/release-surprise";
import type { ForecastResult } from "@liquidation/domain/market/types";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { EMPTY_VALUE, LOCALES } from "../../../shared/constants.ts";
import { numericTone } from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import { useMarketMessages } from "../messages.ts";
import { reactionFormatters } from "../quote-format.ts";
import { ForecastBreakdown } from "./forecast-breakdown.tsx";
import { useNewsReactionMessages } from "./messages.ts";
import type { NewsReleaseDetailProps } from "./types.ts";

export function ReleaseDetail({ series, close }: NewsReleaseDetailProps) {
  const m = useNewsReactionMessages();
  const market = useMarketMessages();
  const { language, t, format } = useLocale();
  const labelId = useId();
  const detailsId = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const [filter, setFilter] = useState<ForecastResult>();
  const releases = useMemo(
    () => compareReleaseObservations(series.observations),
    [series.observations],
  );
  const groups = useMemo(
    () => summarizeForecastReactions(releases),
    [releases],
  );
  const active = groups.some(({ result, count }) => count && result === filter)
    ? filter
    : undefined;
  const visible = active
    ? releases.filter(({ forecast }) => forecast.result === active)
    : releases;
  useEffect(() => heading.current?.focus(), []);
  const number = new Intl.NumberFormat(LOCALES[language], {
    signDisplay: "exceptZero",
    maximumSignificantDigits: 8,
  });
  const { price, percent, move } = reactionFormatters(
    LOCALES[language],
    series.symbol,
    market.pips,
  );
  return (
    <section className="news-release-detail" aria-labelledby={labelId}>
      <div className="panel-heading">
        <h3 tabIndex={-1} id={labelId} ref={heading}>
          {series.event.name} · {series.symbol}
        </h3>
        <button className="secondary" type="button" onClick={close}>
          {t.close}
        </button>
      </div>
      {series.symbol === OFFSHORE_YUAN_PAIR && (
        <p className="news-reactions-hint">{market.yuanProxy}</p>
      )}
      <ForecastBreakdown
        groups={groups}
        active={active}
        onSelect={setFilter}
        detailId={detailsId}
      />
      <div className="news-release-filter" aria-live="polite">
        <h4 id={detailsId}>
          {m.releases} · {format.integer.format(visible.length)}
        </h4>
        {active && (
          <button
            type="button"
            className="secondary"
            onClick={() => setFilter(undefined)}
          >
            {m.allReleases}
          </button>
        )}
      </div>
      <div
        className="table news-reactions-table"
        role="region"
        tabIndex={0}
        aria-labelledby={detailsId}
      >
        <table>
          <thead>
            <tr>
              <th scope="col" title={market.localTime}>
                {m.releaseDate}
              </th>
              <th scope="col">{market.actual}</th>
              <th scope="col">{market.forecast}</th>
              <th scope="col">{m.forecastDifference}</th>
              <th scope="col">{market.previous}</th>
              <th scope="col">{market.beforeRelease}</th>
              {RELEASE_REACTION_MINUTES.map((minutes) => (
                <th key={minutes} scope="col">
                  {market.afterRelease(minutes)}
                </th>
              ))}
              <th scope="col">{m.candleInterval}</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(({ observation: { event, reaction }, forecast }) => (
              <tr key={releaseObservationKey(event, reaction.symbol)}>
                <th scope="row">
                  <DateText value={event.at} withTime />
                </th>
                <td>{event.actual || EMPTY_VALUE}</td>
                <td>{event.forecast || EMPTY_VALUE}</td>
                <td>
                  {forecast.result === FORECAST_RESULT.MISSING ? (
                    EMPTY_VALUE
                  ) : (
                    <strong>
                      {number.format(forecast.difference)}
                      {forecast.unit === PERCENT_READING_UNIT
                        ? " " + m.percentagePoints
                        : forecast.unit}
                    </strong>
                  )}
                  <small>{m.comparisons[forecast.result]}</small>
                </td>
                <td>{event.previous || EMPTY_VALUE}</td>
                <td>{price.format(reaction.before)}</td>
                {reaction.closes.map((close, index) => {
                  const delta = close === null ? null : close - reaction.before;
                  return (
                    <td key={RELEASE_REACTION_MINUTES[index]}>
                      {close === null || delta === null ? (
                        EMPTY_VALUE
                      ) : (
                        <>
                          <span className={numericTone(delta)}>
                            {move(delta)} ·{" "}
                            {percent.format(delta / reaction.before)}
                          </span>
                          <small>{price.format(close)}</small>
                        </>
                      )}
                    </td>
                  );
                })}
                <td>{reaction.interval}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
