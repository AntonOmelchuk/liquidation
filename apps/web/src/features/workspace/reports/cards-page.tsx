import { cardIndex } from "@liquidation/domain/workspace/report-index";
import {
  PERIOD,
  QUARTER_MONTHS,
} from "@liquidation/domain/workspace/constants";
import {
  calendarDate,
  localDay,
  periodBounds,
  shiftMonth,
} from "@liquidation/domain/workspace/period";
import { PAGE_HASHES } from "../../../app/constants.ts";
import { cardsHref, reportHref } from "../../../app/page.ts";
import { LOCALES } from "../../../shared/constants.ts";
import { numericTone } from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import { Panel } from "../../../shared/ui/layout.tsx";
import { JOURNAL_STATUS } from "../../journal/data/constants.ts";
import { useJournal } from "../../journal/data/store.ts";
import { JournalUnavailable } from "../../journal/journal-unavailable.tsx";
import { useWorkspaceMessages } from "../messages.ts";
import { useReportIndexMessages } from "./index-messages.ts";
import type { CardPageProps } from "./types.ts";
import "./reports-index.css";

export default function CardsPage({ day }: CardPageProps) {
  const { t, format, language } = useLocale();
  const m = useWorkspaceMessages();
  const c = useReportIndexMessages();
  const { trades, positions, workspace, status } = useJournal();
  const today = localDay(new Date().toISOString());
  const quarter = periodBounds(PERIOD.QUARTER, day ?? today);
  const weeks = cardIndex(
    { trades: trades ?? [], positions, reports: workspace.reports },
    quarter.start,
  );
  const weekday = new Intl.DateTimeFormat(LOCALES[language], {
    weekday: "short",
    timeZone: "UTC",
  });
  const dailyCount = weeks.reduce(
    (total, week) => total + week.days.filter((date) => date.report).length,
    0,
  );
  const weeklyCount = weeks.filter((week) => week.weekly.report).length;
  const month = quarter.start.slice(0, 7);
  if (status !== JOURNAL_STATUS.READY)
    return (
      <JournalUnavailable
        backHref={PAGE_HASHES.journal}
        backLabel={t.backJournal}
        missing={t.noTrades}
      />
    );
  return (
    <main className="cards-page">
      <header className="page-heading">
        <h1>{m.cards}</h1>
        <div className="workspace-actions">
          <a
            className="action-link secondary"
            href={reportHref(PERIOD.DAY, today)}
          >
            {c.addDaily}
          </a>
          <a className="action-link" href={reportHref(PERIOD.WEEK, today)}>
            {c.addWeekly}
          </a>
        </div>
      </header>
      <Panel
        title={c.quarterCalendar}
        detail={
          c.dailyCardCount +
          " · " +
          dailyCount +
          " · " +
          c.weeklyCardCount +
          " · " +
          weeklyCount
        }
      >
        <div className="journal-filters cards-quarter-toolbar">
          <a
            className="action-link secondary"
            href={cardsHref(shiftMonth(month, -QUARTER_MONTHS) + "-01")}
          >
            ← {c.previousQuarter}
          </a>
          <strong>
            Q
            {Math.floor(
              calendarDate(quarter.start).getUTCMonth() / QUARTER_MONTHS,
            ) + 1}{" "}
            · {quarter.start.slice(0, 4)}
          </strong>
          <a
            className="action-link secondary"
            href={cardsHref(shiftMonth(month, QUARTER_MONTHS) + "-01")}
          >
            {c.nextQuarter} →
          </a>
          <a className="record-link" href={cardsHref(today)}>
            {c.currentQuarter}
          </a>
          <label>
            {m.reportPeriod}
            <input
              type="date"
              value={quarter.start}
              onChange={(event) => {
                if (event.target.value)
                  window.location.hash = cardsHref(event.target.value);
              }}
            />
          </label>
        </div>
        <div className="table">
          <table className="cards-calendar" aria-label={c.quarterCalendar}>
            <thead>
              <tr>
                <th scope="col">{m.reportPeriod}</th>
                {weeks[0]?.days.map((date) => (
                  <th key={date.day} scope="col">
                    {weekday.format(calendarDate(date.day))}
                  </th>
                ))}
                <th scope="col">WRC</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((week) => (
                <tr key={week.start}>
                  <th scope="row">
                    {format.day.format(calendarDate(week.start))}
                  </th>
                  {week.days.map((date) => {
                    const report = date.report;
                    const active = date.closed > 0 || date.entered > 0;
                    return (
                      <td
                        key={date.day}
                        className="card-calendar-cell"
                        data-written={Boolean(report)}
                        data-traded={active}
                        data-current={date.day === today}
                      >
                        <a
                          href={reportHref(PERIOD.DAY, date.day)}
                          className="card-calendar-link"
                          aria-current={date.day === today ? "date" : undefined}
                          title={report?.overview || undefined}
                        >
                          <span className="card-cell-date">
                            {date.day.slice(-2)}
                            {report?.grade && <b>{report.grade}</b>}
                          </span>
                          {active || report ? (
                            <>
                              <strong
                                className={numericTone(
                                  date.closed
                                    ? date.net
                                    : (report?.writtenPnl ?? date.net),
                                )}
                              >
                                {format.money.format(
                                  date.closed
                                    ? date.net
                                    : (report?.writtenPnl ?? date.net),
                                )}
                              </strong>
                              <small>
                                {date.closed} ·{" "}
                                <span className="positive">{date.won}</span> /{" "}
                                <span className="negative">{date.lost}</span> /{" "}
                                {date.flat}
                              </small>
                            </>
                          ) : (
                            <small>＋ {c.addCard}</small>
                          )}
                          {!report && active && (
                            <small className="card-missing">
                              {c.tradingWithoutCard}
                            </small>
                          )}
                          {report?.writtenPnl !== undefined &&
                            date.closed > 0 && (
                              <small>
                                {m.writtenPnl} ·{" "}
                                {format.money.format(report.writtenPnl)}
                              </small>
                            )}
                          {report?.overview && (
                            <small className="card-excerpt">
                              {report.overview}
                            </small>
                          )}
                        </a>
                      </td>
                    );
                  })}
                  <td
                    className="card-calendar-cell weekly-card-cell"
                    data-written={Boolean(week.weekly.report)}
                  >
                    <a
                      className="card-calendar-link"
                      href={reportHref(PERIOD.WEEK, week.start)}
                      title={week.weekly.report?.lesson || undefined}
                    >
                      <span className="card-cell-date">
                        WRC
                        <b>
                          {week.weekly.report?.grade}
                          {week.weekly.report?.progress !== undefined &&
                            " · " + week.weekly.report.progress + "/10"}
                        </b>
                      </span>
                      <strong
                        className={numericTone(
                          week.weekly.closed
                            ? week.weekly.net
                            : (week.weekly.report?.writtenPnl ??
                                week.weekly.net),
                        )}
                      >
                        {format.money.format(
                          week.weekly.closed
                            ? week.weekly.net
                            : (week.weekly.report?.writtenPnl ??
                                week.weekly.net),
                        )}
                      </strong>
                      <small>
                        {week.weekly.closed} ·{" "}
                        <span className="positive">{week.weekly.won}</span> /{" "}
                        <span className="negative">{week.weekly.lost}</span> /{" "}
                        {week.weekly.flat} · {week.weekly.open}{" "}
                        {t.openPositions.toLowerCase()}
                      </small>
                      {week.weekly.report?.writtenPnl !== undefined &&
                        week.weekly.closed > 0 && (
                          <small>
                            {m.writtenPnl} ·{" "}
                            {format.money.format(week.weekly.report.writtenPnl)}
                          </small>
                        )}
                      {week.weekly.report ? (
                        <small className="card-excerpt">
                          {week.weekly.report.lesson ||
                            week.weekly.report.overview ||
                            c.written}
                        </small>
                      ) : (
                        <small>＋ {c.weeklyCard}</small>
                      )}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="analytics-hint">{c.weekBasis}</p>
      </Panel>
    </main>
  );
}
