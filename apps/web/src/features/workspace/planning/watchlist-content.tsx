import { deletedPlan } from "@liquidation/domain/journal/trash/trash";
import { netCents } from "@liquidation/domain/trades/trade";
import type { WeeklyWatchlist } from "@liquidation/domain/workspace/types";
import { watchlistSummary } from "@liquidation/domain/workspace/watchlist-analytics";
import { planHref } from "../../../app/page.ts";
import { numericTone } from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import { ScreenshotGallery } from "../../../shared/screenshots/screenshot-gallery.tsx";
import { DirectionBadge } from "../../../shared/ui/direction-badge.tsx";
import { InstrumentIcons } from "../../../shared/ui/instrument-picker.tsx";
import { MetricBar } from "../../../shared/ui/metric-bar.tsx";
import { useJournal } from "../../journal/data/store.ts";
import { usePlanMessages } from "../../plans/messages.ts";
import { useTrashMessages } from "../../trash/messages.ts";
import { GradeBadge } from "../grade-badge.tsx";
import { usePlanningMessages } from "./messages.ts";
import { useWatchlistActivity } from "./use-watchlist-activity.ts";

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
  const activity = useWatchlistActivity();
  const { closedBySymbol, openBySymbol, missedBySymbol, reviewedAssets } =
    watchlistSummary(entry, activity);
  const totalAssets = entry.items.length;
  return (
    <>
      {entry.outlook && <p className="record-prose">{entry.outlook}</p>}
      {totalAssets > 0 && (
        <div className="watchlist-review-progress">
          <span>
            {m.reviewed} ·{" "}
            <strong>
              {format.integer.format(reviewedAssets)}/
              {format.integer.format(totalAssets)}
            </strong>
          </span>
          <MetricBar
            segments={[
              { tone: "positive", ratio: reviewedAssets / totalAssets },
            ]}
          />
        </div>
      )}
      {totalAssets ? (
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
                    <span className="watch-outcome" data-outcome={item.outcome}>
                      {m[item.outcome]}
                    </span>
                  </span>
                </div>
                {(!compact || closed.length > 0 || open > 0 || missed > 0) && (
                  <p className="subdued watch-activity">
                    {m.entriesThisWeek} · {format.integer.format(closed.length)}
                    {closed.length > 0 && (
                      <>
                        {" "}
                        ·{" "}
                        <strong className={numericTone(net)}>
                          {format.money.format(net / 100)}
                        </strong>
                      </>
                    )}
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
      {(entry.review || entry.grade) && (
        <div className="watchlist-saved-review">
          <div className="panel-heading">
            <h3>{m.weekReview}</h3>
            {entry.grade && (
              <span>
                <span className="visually-hidden">{m.weekGrade} </span>
                <GradeBadge value={entry.grade} />
              </span>
            )}
          </div>
          {entry.review && <p className="record-prose">{entry.review}</p>}
        </div>
      )}
    </>
  );
}
