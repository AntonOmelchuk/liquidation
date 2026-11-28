import { ICON_ACTION } from "../../../shared/ui/constants.ts";
import { IconAction } from "../../../shared/ui/icon-action.tsx";
import { TRASH_KIND } from "@liquidation/domain/journal/trash/constants";
import { PERIOD, WEEK_LENGTH } from "@liquidation/domain/workspace/constants";
import {
  calendarDate,
  localDay,
  periodBounds,
  shiftDay,
} from "@liquidation/domain/workspace/period";
import { watchlistWeeks } from "@liquidation/domain/workspace/planning";
import { useState } from "react";
import { PAGE_HASHES, PAGE_VIEW } from "../../../app/constants.ts";
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
import { WatchlistHistory } from "./watchlist-history.tsx";
import "../workspace.css";
import "./planning.css";

export default function WatchlistPage({
  day,
  creating,
}: {
  day?: string;
  creating?: boolean;
}) {
  const { t, format } = useLocale();
  const m = usePlanningMessages();
  const w = useWorkspaceMessages();
  const today = localDay(new Date().toISOString());
  const ready = useJournal((state) => state.status === JOURNAL_STATUS.READY);
  const entries = useJournal((state) => state.workspace.watchlists);
  const { primary, next } = watchlistWeeks(entries, today);
  const { start, through } = periodBounds(PERIOD.WEEK, day ?? primary);
  const entry = entries.find((item) => item.start === start);
  const draft = creating && !entry;
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
    <main className="workspace-page watchlist-page">
      <div className="page-heading">
        <h1>{draft ? m.newWatchlist : m.watchlist}</h1>
        {!draft && !editing && (
          <a className="action-link" href={watchlistHref(next, PAGE_VIEW.NEW)}>
            <span aria-hidden="true">＋</span> {m.newWatchlist}
          </a>
        )}
      </div>
      <div className="layout">
        <Panel
          title={format.day.formatRange(
            calendarDate(start),
            calendarDate(through),
          )}
          detail={
            entry && !editing ? (
              <div className="workspace-actions">
                <IconAction
                  icon={ICON_ACTION.EDIT}
                  label={w.edit}
                  onClick={() => setEditing(true)}
                />
                <DeleteRecord
                  kind={TRASH_KIND.WATCHLIST}
                  recordKey={start}
                  revision={entry.revision}
                />
              </div>
            ) : undefined
          }
        >
          {!draft && !editing && (
            <div className="journal-filters">
              <label>
                {m.week}
                <input
                  type="date"
                  value={start}
                  onChange={(event) => {
                    if (event.target.value)
                      window.location.hash = watchlistHref(event.target.value);
                  }}
                />
              </label>
              <div className="workspace-actions">
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
              </div>
            </div>
          )}
          {editing || draft ? (
            <WatchlistEditor
              key={start}
              week={start}
              entry={entry}
              onClose={(saved) => {
                if (draft) {
                  window.location.hash = saved
                    ? watchlistHref(start)
                    : PAGE_HASHES.watchlist;
                } else {
                  setEditing(false);
                }
              }}
            />
          ) : entry ? (
            <WatchlistContent entry={entry} />
          ) : (
            <>
              <p>{m.noWatchlist}</p>
              {start !== next && (
                <a
                  className="action-link secondary"
                  href={watchlistHref(start, PAGE_VIEW.NEW)}
                >
                  {m.newWatchlist}
                </a>
              )}
            </>
          )}
        </Panel>
        <WatchlistHistory
          entries={entries.filter((item) => item.start !== start)}
        />
      </div>
    </main>
  );
}
