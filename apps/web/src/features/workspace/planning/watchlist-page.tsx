import { TRASH_KIND } from "@liquidation/domain/journal/trash/constants";
import { PERIOD, WEEK_LENGTH } from "@liquidation/domain/workspace/constants";
import {
  calendarDate,
  localDay,
  periodBounds,
  shiftDay,
} from "@liquidation/domain/workspace/period";
import { useState } from "react";
import { PAGE_HASHES } from "../../../app/constants.ts";
import { watchlistHref } from "../../../app/page.ts";
import { useLocale } from "../../../shared/messages.ts";
import { Panel } from "../../../shared/ui/layout.tsx";
import { JOURNAL_STATUS } from "../../journal/data/constants.ts";
import { useJournal } from "../../journal/data/store.ts";
import { JournalUnavailable } from "../../journal/journal-unavailable.tsx";
import { DeleteRecord } from "../../trash/delete-record.tsx";
import { useWorkspaceMessages } from "../messages.ts";
import { usePlanningMessages } from "./messages.ts";
import { WatchlistContent } from "./watchlist-content.tsx";
import { WatchlistEditor } from "./watchlist-editor.tsx";
import "./planning.css";

export default function WatchlistPage({ day }: { day?: string }) {
  const { t, format } = useLocale();
  const m = usePlanningMessages();
  const w = useWorkspaceMessages();
  const today = localDay(new Date().toISOString());
  const { start, through } = periodBounds(PERIOD.WEEK, day ?? today);
  const ready = useJournal((state) => state.status === JOURNAL_STATUS.READY);
  const entries = useJournal((state) => state.workspace.watchlists);
  const entry = entries.find((item) => item.start === start);
  const [editing, setEditing] = useState(false);
  if (!ready)
    return (
      <JournalUnavailable
        backHref={PAGE_HASHES.journal}
        backLabel={t.backJournal}
        missing={m.noWatchlist}
      />
    );
  return (
    <main className="workspace-page">
      <div className="page-heading">
        <h1>{m.watchlist}</h1>
      </div>
      <div className="layout">
        <Panel
          title={format.day.formatRange(
            calendarDate(start),
            calendarDate(through),
          )}
          detail={
            entry && !editing ? (
              <DeleteRecord
                kind={TRASH_KIND.WATCHLIST}
                recordKey={start}
                revision={entry.revision}
              />
            ) : undefined
          }
        >
          <div className="journal-filters">
            <label>
              {m.week}
              <input
                type="date"
                value={start}
                disabled={editing}
                onChange={(event) => {
                  if (event.target.value)
                    window.location.hash = watchlistHref(event.target.value);
                }}
              />
            </label>
            {!editing && (
              <>
                <a
                  className="action-link secondary"
                  href={watchlistHref(shiftDay(start, -WEEK_LENGTH))}
                >
                  ← {m.previousWeek}
                </a>
                <a
                  className="action-link secondary"
                  href={watchlistHref(today)}
                >
                  {w.thisWeek}
                </a>
                <a
                  className="action-link secondary"
                  href={watchlistHref(shiftDay(start, WEEK_LENGTH))}
                >
                  {m.nextWeek} →
                </a>
              </>
            )}
          </div>
          {editing ? (
            <WatchlistEditor
              week={start}
              entry={entry}
              onClose={() => setEditing(false)}
            />
          ) : (
            <>
              {entry ? (
                <WatchlistContent entry={entry} />
              ) : (
                <p>{m.noWatchlist}</p>
              )}
              <button
                type="button"
                className="secondary"
                onClick={() => setEditing(true)}
              >
                {w.edit}
              </button>
            </>
          )}
        </Panel>
        <Panel title={m.history}>
          <ul className="workspace-history">
            {entries
              .toSorted((a, b) => b.start.localeCompare(a.start))
              .map((item) => (
                <li key={item.start}>
                  <a href={watchlistHref(item.start)} className="record-link">
                    {format.day.format(calendarDate(item.start))}
                  </a>
                </li>
              ))}
          </ul>
        </Panel>
      </div>
    </main>
  );
}
