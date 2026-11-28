import { PERIOD } from "@liquidation/domain/workspace/constants";
import {
  calendarDate,
  periodBounds,
} from "@liquidation/domain/workspace/period";
import { watchlistWeeks } from "@liquidation/domain/workspace/planning";
import { PAGE_VIEW } from "../../../app/constants.ts";
import { watchlistHref } from "../../../app/page.ts";
import { useLocale } from "../../../shared/messages.ts";
import { Panel } from "../../../shared/ui/layout.tsx";
import { useJournal } from "../../journal/data/store.ts";
import { usePlanningMessages } from "./messages.ts";
import { WatchlistContent } from "./watchlist-content.tsx";
import "./planning.css";

export function WeeklyWatchlistPanel({ today }: { today: string }) {
  const { format } = useLocale();
  const m = usePlanningMessages();
  const { start, through } = periodBounds(PERIOD.WEEK, today);
  const entries = useJournal((state) => state.workspace.watchlists);
  const watchlist = entries.find((item) => item.start === start);
  const next = watchlist ? watchlistWeeks(entries, today).next : start;
  return (
    <Panel
      title={m.thisWatchlist}
      detail={format.day.formatRange(
        calendarDate(start),
        calendarDate(through),
      )}
    >
      {watchlist ? (
        <WatchlistContent entry={watchlist} compact />
      ) : (
        <p>{m.noWatchlist}</p>
      )}
      <div className="workspace-actions">
        <a
          className="action-link secondary"
          href={watchlistHref(next, PAGE_VIEW.NEW)}
        >
          <span aria-hidden="true">＋</span> {m.newWatchlist}
        </a>
        {watchlist && (
          <a className="record-link" href={watchlistHref(start)}>
            {m.openWatchlist} →
          </a>
        )}
      </div>
    </Panel>
  );
}
