import { PERIOD } from "@liquidation/domain/workspace/constants";
import {
  calendarDate,
  periodBounds,
} from "@liquidation/domain/workspace/period";
import type { WeeklyWatchlist } from "@liquidation/domain/workspace/types";
import { watchlistSummary } from "@liquidation/domain/workspace/watchlist-analytics";
import { watchlistHref } from "../../../app/page.ts";
import { EMPTY_VALUE } from "../../../shared/constants.ts";
import { numericTone } from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import { Panel } from "../../../shared/ui/layout.tsx";
import { GradeBadge } from "../grade-badge.tsx";
import { usePlanningMessages } from "./messages.ts";
import { useWatchlistActivity } from "./use-watchlist-activity.ts";

export function WatchlistHistory({
  entries,
}: {
  entries: readonly WeeklyWatchlist[];
}) {
  const m = usePlanningMessages();
  const { t, format } = useLocale();
  const activity = useWatchlistActivity();

  if (!entries.length) return null;
  return (
    <Panel title={m.watchlistHistory} detail={entries.length}>
      <div className="table">
        <table className="watchlist-history" aria-label={m.watchlistHistory}>
          <thead>
            <tr>
              <th scope="col">{m.watchlistWeek}</th>
              <th scope="col">{m.reviewed}</th>
              <th scope="col" title={m.planResultsHint}>
                {m.planResults}
              </th>
              <th scope="col">{m.missedTrades}</th>
              <th scope="col" title={m.mistakeCountHint}>
                {m.mistakeCount}
              </th>
              <th scope="col">{t.pnl}</th>
              <th scope="col">{m.weekGrade}</th>
            </tr>
          </thead>
          <tbody>
            {entries
              .toSorted((a, b) => b.start.localeCompare(a.start))
              .map((entry) => {
                const { start, through } = periodBounds(
                  PERIOD.WEEK,
                  entry.start,
                );
                const span = format.day.formatRange(
                  calendarDate(start),
                  calendarDate(through),
                );
                const {
                  reviewedAssets,
                  worked,
                  decided,
                  missedCount,
                  missedAssets,
                  mistakes,
                  net,
                } = watchlistSummary(entry, activity);
                return (
                  <tr key={start}>
                    <th scope="row">
                      <a href={watchlistHref(start)} className="record-link">
                        {span}
                      </a>
                    </th>
                    <td>
                      {entry.items.length
                        ? `${reviewedAssets}/${entry.items.length}`
                        : EMPTY_VALUE}
                    </td>
                    <td>
                      {decided ? (
                        <>
                          <strong className={numericTone(worked)}>
                            {worked}
                          </strong>
                          /{decided}
                        </>
                      ) : (
                        EMPTY_VALUE
                      )}
                    </td>
                    <td>
                      <span className="watchlist-misses">
                        <span
                          className={missedCount > 0 ? "negative" : undefined}
                        >
                          {format.integer.format(missedCount)}
                        </span>
                        {missedAssets > 0 && (
                          <span
                            className="watchlist-missed-assets"
                            title={m.missedAssets}
                          >
                            <span aria-hidden="true">⚑</span>
                            <span className="visually-hidden">
                              {m.missedAssets} ·{" "}
                            </span>
                            {format.integer.format(missedAssets)}
                          </span>
                        )}
                      </span>
                    </td>
                    <td className={mistakes ? "negative" : undefined}>
                      {mistakes === null
                        ? EMPTY_VALUE
                        : format.integer.format(mistakes)}
                    </td>
                    <td className={numericTone(net ?? 0)}>
                      {net === null ? EMPTY_VALUE : format.money.format(net)}
                    </td>
                    <td>
                      {entry.grade ? (
                        <GradeBadge value={entry.grade} />
                      ) : (
                        EMPTY_VALUE
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
