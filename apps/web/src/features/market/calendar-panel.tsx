import { currencyFlag } from "@liquidation/domain/instruments/instruments";
import {
  CALENDAR_SOURCE,
  CALENDAR_STATE,
  MARKET_IMPACT,
  MARKET_PROVIDER,
} from "@liquidation/domain/market/constants";
import { localDay } from "@liquidation/domain/workspace/period";
import { useEffect, useId, useState } from "react";
import { EMPTY_VALUE } from "../../shared/constants.ts";
import { formatCompactDay } from "../../shared/format.ts";
import { useLocale } from "../../shared/messages.ts";
import { CheckboxField } from "../../shared/ui/checkbox-field.tsx";
import { InstrumentIcons } from "../../shared/ui/instrument-picker.tsx";
import { Panel } from "../../shared/ui/layout.tsx";
import {
  CALENDAR_CLOCK_MS,
  MARKET_LINKS,
  RELEASE_TIMING,
} from "./constants.ts";
import { useCalendarFeed } from "./feeds.ts";
import { useMarketMessages } from "./messages.ts";
import { ReleaseReactionPanel } from "./release-reaction-panel.tsx";

export function CalendarPanel() {
  const m = useMarketMessages();
  const { t, format } = useLocale();
  const feed = useCalendarFeed();
  const [important, setImportant] = useState(true);
  const [expanded, setExpanded] = useState<string>();
  const reactionId = useId();
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const refreshTime = () => setNow(Date.now());
    const timer = window.setInterval(refreshTime, CALENDAR_CLOCK_MS);
    document.addEventListener("visibilitychange", refreshTime);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshTime);
    };
  }, []);

  const today = localDay(new Date(now).toISOString());
  const source = feed?.source ?? CALENDAR_SOURCE.BIQUOTE;
  const events = feed?.events.filter(
    (event) =>
      (event.allDayOn ?? localDay(event.at)) === today &&
      (!important || event.impact >= MARKET_IMPACT.MEDIUM),
  );
  const selectedEvent = events?.find(
    (event) =>
      event.id === expanded &&
      !event.allDayOn &&
      event.timeKnown &&
      Date.parse(event.at) <= now,
  );
  const nextAt = events?.reduce((next, event) => {
    const time = Date.parse(event.at);
    return !event.allDayOn && event.timeKnown && time >= now
      ? Math.min(next, time)
      : next;
  }, Infinity);
  const available =
    feed?.state === CALENDAR_STATE.READY ||
    feed?.state === CALENDAR_STATE.STALE;

  return (
    <Panel
      id="market-calendar"
      title={m.calendar}
      detail={formatCompactDay(today)}
    >
      <div className="market-toolbar">
        {source === CALENDAR_SOURCE.FOREX_FACTORY && (
          <div className="market-attribution">
            <a
              className="record-link"
              href={MARKET_LINKS[source]}
              target="_blank"
              rel="noreferrer"
            >
              {MARKET_PROVIDER[source]}
            </a>
            <span>{m.calendarFallback}</span>
          </div>
        )}
        {available && (
          <CheckboxField
            checked={important}
            onChange={(event) => setImportant(event.currentTarget.checked)}
          >
            {m.important}
          </CheckboxField>
        )}
      </div>
      {!feed && (
        <p className="market-status" role="status">
          {t.loading}
        </p>
      )}
      {feed?.state === CALENDAR_STATE.UNAVAILABLE && (
        <p className="market-status" role="status">
          {m.calendarError}
        </p>
      )}
      {feed?.state === CALENDAR_STATE.STALE && (
        <p className="market-status" role="status">
          {m.calendarStale}{" "}
          {feed.fetchedAt && (
            <time dateTime={feed.fetchedAt}>
              {format.date.format(Date.parse(feed.fetchedAt))}
            </time>
          )}
        </p>
      )}
      {available &&
        (events?.length ? (
          <div
            className="market-table"
            tabIndex={0}
            role="region"
            aria-label={m.calendar}
          >
            <table>
              <thead>
                <tr>
                  <th scope="col" title={m.localTime}>
                    {m.time}
                  </th>
                  <th scope="col">{m.currency}</th>
                  <th scope="col">{m.event}</th>
                  <th scope="col">{m.impact}</th>
                  <th scope="col">{m.actual}</th>
                  <th scope="col">{m.forecast}</th>
                  <th scope="col">{m.previous}</th>
                  <th scope="col">{m.priceReaction}</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  const time = Date.parse(event.at);
                  const timed = event.timeKnown && !event.allDayOn;
                  const timing = timed
                    ? time < now
                      ? RELEASE_TIMING.PAST
                      : time === nextAt
                        ? RELEASE_TIMING.NEXT
                        : undefined
                    : undefined;
                  const selected = selectedEvent?.id === event.id;
                  return (
                    <tr key={event.id} data-timing={timing}>
                      <td>
                        {timed ? (
                          <time dateTime={event.at} title={m.localTime}>
                            {format.clock.format(Date.parse(event.at))}
                          </time>
                        ) : event.allDayOn ? (
                          m.allDay
                        ) : (
                          m.timePending
                        )}
                      </td>
                      <td>
                        <span className="instrument-label market-currency">
                          {currencyFlag(event.currency) && (
                            <InstrumentIcons symbol={event.currency} />
                          )}
                          <strong>{event.currency}</strong>
                        </span>
                      </td>
                      <th scope="row">
                        {event.name}
                        {timing === RELEASE_TIMING.NEXT && (
                          <span className="market-next-label">
                            {m.nextRelease}
                          </span>
                        )}
                        {timing === RELEASE_TIMING.PAST && (
                          <span className="visually-hidden">
                            {" "}
                            · {m.pastRelease}
                          </span>
                        )}
                      </th>
                      <td>
                        <span
                          className="market-impact"
                          data-impact={event.impact}
                        >
                          {m.impacts[event.impact]}
                        </span>
                      </td>
                      <td className="market-actual">
                        {event.allDayOn ? null : event.actual ? (
                          <strong>{event.actual}</strong>
                        ) : (
                          EMPTY_VALUE
                        )}
                      </td>
                      <td>
                        {event.allDayOn ? null : event.forecast || EMPTY_VALUE}
                      </td>
                      <td>
                        {event.allDayOn ? null : event.previous || EMPTY_VALUE}
                      </td>
                      <td>
                        {timed && time <= now ? (
                          <button
                            type="button"
                            className="secondary market-reaction-trigger"
                            aria-expanded={selected}
                            aria-controls={selected ? reactionId : undefined}
                            aria-label={m.priceReaction + " · " + event.name}
                            onClick={() =>
                              setExpanded(selected ? undefined : event.id)
                            }
                          >
                            {m.priceReaction}
                          </button>
                        ) : event.allDayOn ? null : (
                          EMPTY_VALUE
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="market-status">{m.emptyDay}</p>
        ))}
      {selectedEvent && (
        <ReleaseReactionPanel
          key={selectedEvent.id}
          id={reactionId}
          event={selectedEvent}
          now={now}
        />
      )}
    </Panel>
  );
}
