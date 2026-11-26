import { deletedPlan } from "@liquidation/domain/journal/trash/trash";
import { netCents } from "@liquidation/domain/trades/trade";
import { reviewTrades } from "@liquidation/domain/workspace/analytics";
import { PERIOD, WATCH_OUTCOME } from "@liquidation/domain/workspace/constants";
import { localDay, periodBounds } from "@liquidation/domain/workspace/period";
import { isBreakevenReviewReason } from "@liquidation/domain/workspace/planning";
import type { WeeklyWatchlist } from "@liquidation/domain/workspace/types";
import { planHref } from "../../../app/page.ts";
import { useLocale } from "../../../shared/messages.ts";
import { ScreenshotGallery } from "../../../shared/screenshots/screenshot-gallery.tsx";
import { DirectionBadge } from "../../../shared/ui/direction-badge.tsx";
import { InstrumentIcons } from "../../../shared/ui/instrument-picker.tsx";
import { useJournal } from "../../journal/data/store.ts";
import { usePlanMessages } from "../../plans/messages.ts";
import { useTrashMessages } from "../../trash/messages.ts";
import { usePlanningMessages } from "./messages.ts";

export function WatchlistContent({
  entry,
  compact = false,
}: {
  entry: WeeklyWatchlist;
  compact?: boolean;
}) {
  const m = usePlanningMessages();
  const p = usePlanMessages();
  const d = useTrashMessages();
  const { format } = useLocale();
  const plans = useJournal((state) => state.plans);
  const trash = useJournal((state) => state.trash);
  const trades = useJournal((state) => state.trades);
  const positions = useJournal((state) => state.positions);
  const misses = useJournal((state) => state.workspace.missedTrades);
  const { start, through } = periodBounds(PERIOD.WEEK, entry.start);
  const duringWeek = (iso: string) => {
    const day = localDay(iso);
    return day >= start && day <= through;
  };
  const closedBySymbol = Map.groupBy(
    reviewTrades(trades ?? [], PERIOD.WEEK, start),
    ({ symbol }) => symbol,
  );
  const openBySymbol = Map.groupBy(
    positions.filter(({ openedAt }) => duringWeek(openedAt)),
    ({ symbol }) => symbol,
  );
  const missedBySymbol = Map.groupBy(
    misses.filter(
      ({ missedAt, reason }) =>
        duringWeek(missedAt) && !isBreakevenReviewReason(reason),
    ),
    ({ symbol }) => symbol,
  );
  const reviewed = entry.items.filter(
    ({ outcome }) => outcome !== WATCH_OUTCOME.PENDING,
  ).length;
  return (
    <>
      {entry.outlook && <p className="record-prose">{entry.outlook}</p>}
      <p className="subdued">
        {m.reviewed} · {format.integer.format(reviewed)}/
        {format.integer.format(entry.items.length)}
      </p>
      {entry.items.length ? (
        <ul className="watch-summary-list">
          {entry.items.map((item) => {
            const closed = closedBySymbol.get(item.symbol) ?? [];
            const open = openBySymbol.get(item.symbol)?.length ?? 0;
            const missed = missedBySymbol.get(item.symbol)?.length ?? 0;
            const net = closed.reduce(
              (total, trade) => total + netCents(trade),
              0,
            );
            return (
              <li key={item.symbol}>
                <div className="panel-heading">
                  <strong className="instrument-label">
                    <InstrumentIcons symbol={item.symbol} />
                    {item.symbol}
                  </strong>
                  <span className="watch-asset-result subdued">
                    <DirectionBadge direction={item.narrative}>
                      {p[item.narrative]}
                    </DirectionBadge>
                    <span>{m[item.outcome]}</span>
                  </span>
                </div>
                {(!compact || closed.length > 0 || open > 0 || missed > 0) && (
                  <p className="subdued watch-activity">
                    {m.entriesThisWeek} · {format.integer.format(closed.length)}
                    {closed.length > 0 &&
                      ` (${format.money.format(net / 100)})`}
                    {` · ${m.openThisWeek} ${format.integer.format(open)}`}
                    {` · ${m.opportunitiesThisWeek} ${format.integer.format(missed)}`}
                  </p>
                )}
                {item.notes && <p className="record-prose">{item.notes}</p>}
                {item.planIds.map((id) => {
                  const plan = plans.find((plan) => plan.id === id);
                  const old = deletedPlan(trash, id);
                  return plan ? (
                    <div key={id}>
                      <a className="record-link" href={planHref(id)}>
                        {plan.setup.title}
                      </a>
                    </div>
                  ) : (
                    old && (
                      <p key={id}>
                        {old.setup.title} · {d.deleted}
                      </p>
                    )
                  );
                })}
                {!compact && (
                  <>
                    <ScreenshotGallery ids={item.screenshotIds} />
                    {item.review && (
                      <div>
                        <h4>{m.assetReview}</h4>
                        <p className="record-prose">{item.review}</p>
                      </div>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p>{m.noWatchlist}</p>
      )}
      {entry.review && (
        <div>
          <h3>{m.weekReview}</h3>
          <p className="record-prose">{entry.review}</p>
        </div>
      )}
    </>
  );
}
