import { PERIOD } from "@liquidation/domain/workspace/constants";
import {
  calendarDate,
  localDay,
  periodBounds,
} from "@liquidation/domain/workspace/period";
import type { PreparationPeriod } from "@liquidation/domain/workspace/types";
import { PAGE_HASHES } from "../../../app/constants.ts";
import { thoughtHref } from "../../../app/page.ts";
import { useLocale } from "../../../shared/messages.ts";
import { Panel } from "../../../shared/ui/layout.tsx";
import { JOURNAL_STATUS } from "../../journal/data/constants.ts";
import { useJournal } from "../../journal/data/store.ts";
import { JournalUnavailable } from "../../journal/journal-unavailable.tsx";
import { useWorkspaceMessages } from "../messages.ts";
import { usePlanningMessages } from "./messages.ts";
import { PeriodThoughtsPanel } from "./period-thoughts-panel.tsx";

export default function ThoughtsPage({
  day,
  period = PERIOD.DAY,
}: {
  day?: string;
  period?: PreparationPeriod;
}) {
  const { t, format } = useLocale();
  const m = usePlanningMessages();
  const w = useWorkspaceMessages();
  const ready = useJournal((state) => state.status === JOURNAL_STATUS.READY);
  const { preparations, thoughts } = useJournal((state) => state.workspace);
  const today = localDay(new Date().toISOString());
  const date = day ?? today;
  const daily = period === PERIOD.DAY;
  const { start } = periodBounds(period, date);
  const current = periodBounds(period, today).start;
  const dates = [
    ...new Set([
      ...preparations
        .filter(({ kind }) => kind === period)
        .map(({ start }) => start),
      ...(daily ? thoughts.map(({ day }) => day) : []),
    ]),
  ].sort((a, b) => b.localeCompare(a));

  if (!ready)
    return (
      <JournalUnavailable
        backHref={PAGE_HASHES.journal}
        backLabel={t.backJournal}
        missing={m.noThought}
      />
    );

  return (
    <main className="workspace-page">
      <div className="page-heading">
        <h1>{m.thoughts}</h1>
        {start !== current && (
          <a
            className="action-link secondary"
            href={thoughtHref(today, period)}
          >
            {daily ? w.today : w.thisWeek}
          </a>
        )}
      </div>
      <div className="layout">
        <PeriodThoughtsPanel
          period={period}
          day={date}
          onPeriodChange={(kind) => {
            if (kind !== period) window.location.hash = thoughtHref(date, kind);
          }}
          onDayChange={(next) => {
            window.location.hash = thoughtHref(next, period);
          }}
        />
        <Panel title={m.history}>
          {dates.length ? (
            <ul className="workspace-history">
              {dates.map((item) => (
                <li key={item}>
                  <a
                    className="record-link"
                    href={thoughtHref(item, period)}
                    aria-current={item === start ? "date" : undefined}
                  >
                    {format.day.format(calendarDate(item))}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p>{w.noEntries}</p>
          )}
        </Panel>
      </div>
    </main>
  );
}
