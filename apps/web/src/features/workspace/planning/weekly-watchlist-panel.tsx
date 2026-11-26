import { PERIOD } from "@liquidation/domain/workspace/constants";
import {
  calendarDate,
  periodBounds,
} from "@liquidation/domain/workspace/period";
import { watchlistHref } from "../../../app/page.ts";
import { useLocale } from "../../../shared/messages.ts";
import { Panel } from "../../../shared/ui/layout.tsx";
import { useJournal } from "../../journal/data/store.ts";
import { useWorkspaceMessages } from "../messages.ts";
import { usePlanningMessages } from "./messages.ts";
import { WatchlistContent } from "./watchlist-content.tsx";
import "./planning.css";

export function WeeklyWatchlistPanel({ today }: { today: string }) {
  const { format } = useLocale();
  const m = usePlanningMessages();
  const w = useWorkspaceMessages();
  const { start, through } = periodBounds(PERIOD.WEEK, today);
  const watchlist = useJournal((state) =>
    state.workspace.watchlists.find((item) => item.start === start),
  );
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
      <a className="action-link secondary" href={watchlistHref(start)}>
        {w.edit}
      </a>
    </Panel>
  );
}
