import { calendarMonth } from "@liquidation/domain/workspace/analytics";
import { PERIOD } from "@liquidation/domain/workspace/constants";
import {
  calendarDate,
  localDay,
  shiftMonth,
} from "@liquidation/domain/workspace/period";
import { useMemo, useState } from "react";
import { reportHref } from "../../../app/page.ts";
import { EMPTY_VALUE, LOCALES } from "../../../shared/constants.ts";
import {
  capitalizeFirst,
  createCurrencyFormatter,
  numericTone,
} from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import { Panel } from "../../../shared/ui/layout.tsx";
import { useWorkspaceMessages } from "../../workspace/messages.ts";
import { useJournal } from "../data/store.ts";
import { CalendarTradePreview } from "./calendar-trade-preview.tsx";
import { CHART_TONE } from "./constants.ts";
import { useDashboardMessages } from "./messages.ts";
import { TRADE_TABLE_MODE } from "../records/constants.ts";
import { TradeTable } from "../records/trade-table.tsx";
import type { CalendarProps, DailyPnlProps } from "./types.ts";

export function PnlCalendar({
  trades,
  positions,
  initialMonth,
  today,
}: CalendarProps) {
  const { t, language, format } = useLocale();
  const m = useWorkspaceMessages();
  const labels = useDashboardMessages();
  const [chosenMonth, setChosenMonth] = useState("");
  const [selection, setSelectedDay] = useState<string>();
  const month = chosenMonth || initialMonth;
  const selectedDay = selection?.startsWith(month) ? selection : undefined;
  const data = useMemo(
    () => calendarMonth(trades, month, localDay, positions),
    [trades, positions, month],
  );
  const locale = LOCALES[language];
  const currency = useJournal((state) => state.currency);
  const money = createCurrencyFormatter(locale, currency);
  const signedMoney = createCurrencyFormatter(locale, currency, {
    signDisplay: "exceptZero",
  });
  const monthLabel = capitalizeFirst(
    new Intl.DateTimeFormat(locale, {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(calendarDate(month + "-01")),
    locale,
  );
  const weekday = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    timeZone: "UTC",
  });
  const compact = createCurrencyFormatter(locale, currency, {
    notation: "compact",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    signDisplay: "exceptZero",
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
            {t.pnl} · {signedMoney.format(data.net / 100)}
          </span>
          <span>
            {m.activeDays} · {format.integer.format(data.active)}
          </span>
        </div>
      </div>
      <div
        className="calendar-scroll"
        tabIndex={0}
        role="region"
        aria-label={m.calendar + " · " + monthLabel}
      >
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
            {data.weeks.map(({ dates, net, active, closedDays }) => (
              <tr key={dates[0]}>
                {dates.map((day) => {
                  const daily = data.days.get(day);
                  const closed = daily?.trades.length ? daily : undefined;
                  const openCount = daily?.positions.length ?? 0;
                  const dayNumber = calendarDate(day).getUTCDate();
                  const previewId = "calendar-preview-" + day;
                  const label = [format.day.format(calendarDate(day))];
                  if (closed)
                    label.push(
                      t.pnl + " " + signedMoney.format(closed.net / 100),
                      t.count + " " + closed.trades.length,
                    );
                  if (openCount) label.push(t.openPositions + " " + openCount);
                  return (
                    <td key={day}>
                      {day.startsWith(month) && (
                        <button
                          type="button"
                          className={
                            "calendar-day " +
                            (closed
                              ? (numericTone(closed.net) ?? "calendar-flat")
                              : openCount
                                ? "calendar-open-only"
                                : "")
                          }
                          aria-current={day === today ? "date" : undefined}
                          aria-pressed={selectedDay === day}
                          aria-label={label.join(" · ")}
                          aria-describedby={daily ? previewId : undefined}
                          title={label.join(" · ")}
                          onClick={() =>
                            setSelectedDay((previous) =>
                              previous === day ? undefined : day,
                            )
                          }
                        >
                          <span className="calendar-day-heading">
                            <span className="calendar-day-number">
                              {dayNumber}
                            </span>
                            {closed && (
                              <strong className={numericTone(closed.net)}>
                                {compact.format(closed.net / 100)}
                              </strong>
                            )}
                          </span>
                          {daily && (
                            <CalendarTradePreview
                              id={previewId}
                              day={daily}
                              money={money}
                            />
                          )}
                          {daily && (
                            <span className="calendar-day-summary">
                              {closed && (
                                <span
                                  title={t.count + " · " + closed.trades.length}
                                >
                                  {closed.trades.length} ·{" "}
                                  {format.percentage.format(
                                    closed.wins / closed.trades.length,
                                  )}
                                </span>
                              )}
                              {openCount > 0 && (
                                <span className="calendar-open-count">
                                  {m.openOnDay} · {openCount}
                                </span>
                              )}
                            </span>
                          )}
                        </button>
                      )}
                    </td>
                  );
                })}
                <td
                  className={
                    "calendar-week " +
                    (closedDays ? (numericTone(net) ?? "calendar-flat") : "")
                  }
                >
                  <strong className={numericTone(net)}>
                    {closedDays ? compact.format(net / 100) : EMPTY_VALUE}
                  </strong>
                  <span>
                    {m.activeDays} · {format.integer.format(active)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="calendar-legend">
        <li data-tone={CHART_TONE.WIN}>
          <i aria-hidden="true" />
          {labels.profitDay}
        </li>
        <li data-tone={CHART_TONE.LOSS}>
          <i aria-hidden="true" />
          {labels.lossDay}
        </li>
        <li data-tone={CHART_TONE.FLAT}>
          <i aria-hidden="true" />
          {labels.flatDay}
        </li>
      </ul>
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
          {selected ? (
            <TradeTable
              trades={[...selected.trades, ...selected.positions]}
              mode={
                selected.positions.length === 0
                  ? TRADE_TABLE_MODE.CLOSED
                  : selected.trades.length === 0
                    ? TRADE_TABLE_MODE.OPEN
                    : TRADE_TABLE_MODE.MIXED
              }
              label={
                m.selectedDay +
                " " +
                format.day.format(calendarDate(selectedDay))
              }
            />
          ) : (
            <p>{m.noDayRecords}</p>
          )}
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
  const sorted = [...days.entries()]
    .filter(([, { trades }]) => trades.length > 0)
    .sort(([a], [b]) => a.localeCompare(b));
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
                data-flat={net === 0 || undefined}
                style={
                  net < 0
                    ? { height: size, top: "50%" }
                    : net > 0
                      ? { height: size, bottom: "50%" }
                      : undefined
                }
              />
            </li>
          );
        })}
      </ol>
    </div>
  );
}
