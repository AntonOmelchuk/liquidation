import { PERIOD } from "@liquidation/domain/workspace/constants";
import {
  calendarDate,
  periodBounds,
} from "@liquidation/domain/workspace/period";
import { thoughtHref, watchlistHref } from "../../../app/page.ts";
import { useLocale } from "../../../shared/messages.ts";
import { Panel } from "../../../shared/ui/layout.tsx";
import { ScreenshotGallery } from "../../../shared/screenshots/screenshot-gallery.tsx";
import { useJournal } from "../../journal/data/store.ts";
import { useWorkspaceMessages } from "../messages.ts";
import { usePlanningMessages } from "./messages.ts";
import { WatchlistContent } from "./watchlist-content.tsx";
import "./planning.css";

export function DailyThoughtsPanel({ today }: { today: string }) {
  const { format } = useLocale();
  const m = usePlanningMessages();
  const w = useWorkspaceMessages();
  const thought = useJournal((state) =>
    state.workspace.thoughts.find(({ day }) => day === today),
  );
  return (
    <Panel
      title={m.todayThoughts}
      detail={format.day.format(calendarDate(today))}
    >
      {thought?.text && <p className="record-prose">{thought.text}</p>}
      {!thought && <p>{m.noThought}</p>}
      {thought && <ScreenshotGallery ids={thought.screenshotIds} />}
      <a className="action-link secondary" href={thoughtHref(today)}>
        {thought ? w.edit : m.writeThought}
      </a>
    </Panel>
  );
}

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
