import {
  calendarMonth,
  newestTrades,
} from "@liquidation/domain/workspace/analytics";
import { PERIOD } from "@liquidation/domain/workspace/constants";
import { calendarDate, shiftMonth } from "@liquidation/domain/workspace/period";
import { useMemo, useState } from "react";
import { reportHref } from "../../../app/page.ts";
import { EMPTY_VALUE, LOCALES } from "../../../shared/constants.ts";
import { numericTone } from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import { Panel } from "../../../shared/ui/layout.tsx";
import { useWorkspaceMessages } from "../../workspace/messages.ts";
import { TradeTable } from "../records/trade-table.tsx";
import type { CalendarProps, DailyPnlProps } from "./types.ts";

export function PnlCalendar({ trades, initialMonth, today }: CalendarProps) {
  const { t, language, format } = useLocale();
  const m = useWorkspaceMessages();
  const [chosenMonth, setChosenMonth] = useState("");
  const [selection, setSelectedDay] = useState<string>();
  const month = chosenMonth || initialMonth;
  const selectedDay = selection?.startsWith(month) ? selection : undefined;
  const data = useMemo(() => calendarMonth(trades, month), [trades, month]);
  const locale = LOCALES[language];
  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(calendarDate(month + "-01"));
  const weekday = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    timeZone: "UTC",
  });
  const compact = new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 2,
  });
  const selected = selectedDay ? data.days.get(selectedDay) : undefined;
  const isCurrentMonth = month === today.slice(0, 7);

  function showMonth(next: string) {
    setChosenMonth(next);
    setSelectedDay(undefined);
  }

  return (
    <Panel title={m.calendar} detail={m.calendarZone}>
      <div className="calendar-toolbar">
        <div className="calendar-controls">
          <button
            type="button"
            className="secondary"
            aria-label={m.previousMonth}
            onClick={() => showMonth(shiftMonth(month, -1))}
          >
            ←
          </button>
          <strong aria-live="polite">{monthLabel}</strong>
          <button
            type="button"
            className="secondary"
            aria-label={m.nextMonth}
            onClick={() => showMonth(shiftMonth(month, 1))}
          >
            →
          </button>
          <button
            type="button"
            className="secondary"
            disabled={isCurrentMonth}
            onClick={() => showMonth(today.slice(0, 7))}
          >
            {m.thisMonth}
          </button>
        </div>
        <div className="calendar-totals">
          <span className={numericTone(data.net)}>
            {t.pnl} · {format.money.format(data.net / 100)}
          </span>
          <span>
            {m.activeDays} · {format.integer.format(data.active)}
          </span>
        </div>
      </div>
      <div className="calendar-scroll">
        <table
          className="pnl-calendar"
          aria-label={m.calendar + " · " + monthLabel}
        >
          <thead>
            <tr>
              {data.weeks[0].dates.map((day) => (
                <th scope="col" key={day}>
                  {weekday.format(calendarDate(day))}
                </th>
              ))}
              <th scope="col">{m.weeklyTotal}</th>
            </tr>
          </thead>
          <tbody>
            {data.weeks.map(({ dates, net, active }) => (
              <tr key={dates[0]}>
                {dates.map((day) => {
                  const daily = data.days.get(day);
                  const dayNumber = calendarDate(day).getUTCDate();
                  const label =
                    format.day.format(calendarDate(day)) +
                    (daily
                      ? " · " +
                        t.pnl +
                        " " +
                        format.money.format(daily.net / 100) +
                        " · " +
                        t.count +
                        " " +
                        daily.trades.length
                      : "");
                  return (
                    <td key={day}>
                      {day.startsWith(month) && (
                        <button
                          key={day}
                          type="button"
                          className={
                            "calendar-day " +
                            (daily
                              ? (numericTone(daily.net) ?? "calendar-flat")
                              : "")
                          }
                          aria-current={day === today ? "date" : undefined}
                          aria-pressed={selectedDay === day}
                          aria-label={label}
                          title={label}
                          onClick={() =>
                            setSelectedDay((previous) =>
                              previous === day ? undefined : day,
                            )
                          }
                        >
                          <span>{dayNumber}</span>
                          {daily && (
                            <>
                              <strong>{compact.format(daily.net / 100)}</strong>
                              <span>
                                {t.count} · {daily.trades.length}
                              </span>
                              <span>
                                {format.percentage.format(
                                  daily.wins / daily.trades.length,
                                )}
                              </span>
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  );
                })}
                <td className="calendar-week">
                  <strong className={numericTone(net)}>
                    {active ? compact.format(net / 100) : EMPTY_VALUE}
                  </strong>
                  <span>
                    {m.activeDays} · {active}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedDay && (
        <section
          className="calendar-drilldown"
          aria-label={m.selectedDay + " " + selectedDay}
        >
          <div className="panel-heading">
            <h3>
              {m.selectedDay} {format.day.format(calendarDate(selectedDay))}
            </h3>
            <button
              type="button"
              className="secondary"
              aria-label={m.closeDay}
              onClick={() => setSelectedDay(undefined)}
            >
              ×
            </button>
          </div>
          <TradeTable trades={newestTrades(selected?.trades ?? [])} />
          {selectedDay <= today && (
            <a
              className="record-link"
              href={reportHref(PERIOD.DAY, selectedDay)}
            >
              {m.day} →
            </a>
          )}
        </section>
      )}
      <DailyPnl days={data.days} />
    </Panel>
  );
}

function DailyPnl({ days }: DailyPnlProps) {
  const { format } = useLocale();
  const m = useWorkspaceMessages();
  const sorted = [...days.entries()].sort(([a], [b]) => a.localeCompare(b));
  if (!sorted.length) return <p>{m.noCalendarTrades}</p>;
  const max = Math.max(1, ...sorted.map(([, { net }]) => Math.abs(net)));
  return (
    <div className="calendar-chart">
      <h3>{m.daily}</h3>
      <ol aria-label={m.daily}>
        {sorted.map(([day, { net }]) => {
          const label =
            format.day.format(calendarDate(day)) +
            " · " +
            format.money.format(net / 100);
          const size = Math.max(3, (50 * Math.abs(net)) / max) + "%";
          return (
            <li key={day} aria-label={label} title={label}>
              <span
                className={numericTone(net)}
                style={
                  net < 0
                    ? { height: size, top: "50%" }
                    : { height: size, bottom: "50%" }
                }
              />
            </li>
          );
        })}
      </ol>
    </div>
  );
}
