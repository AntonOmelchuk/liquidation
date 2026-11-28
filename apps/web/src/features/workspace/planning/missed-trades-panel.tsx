import { missedStatistics } from "@liquidation/domain/analytics/missed-statistics";
import { executedPlanIds } from "@liquidation/domain/analytics/plan-performance";
import { localDay } from "@liquidation/domain/workspace/period";
import { useMemo } from "react";
import { PAGE_HASHES, PAGE } from "../../../app/constants.ts";
import { newMissedTradeHref } from "../../../app/page.ts";
import { EMPTY_VALUE } from "../../../shared/constants.ts";
import { numericTone } from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import { Panel } from "../../../shared/ui/layout.tsx";
import { MetricBar } from "../../../shared/ui/metric-bar.tsx";
import { MetricCard, MetricGrid } from "../../../shared/ui/metric-card.tsx";
import { METRIC_TONE } from "../../../shared/ui/metric-constants.ts";
import { useJournal } from "../../journal/data/store.ts";
import { BreakevenReviewSummary } from "./breakeven-review-summary.tsx";
import { MISSED_TRADES_PANEL_ID } from "./constants.ts";
import { usePlanningMessages } from "./messages.ts";
import { MissedBreakdown } from "./missed-breakdown.tsx";
import { MissedTradesTable } from "./missed-trades-table.tsx";
import type { MissedTradesPanelProps } from "./types.ts";
import "./planning.css";

export function MissedTradesShortcut({
  disabled,
  withinReport,
}: {
  disabled?: boolean;
  withinReport?: boolean;
}) {
  const m = usePlanningMessages();
  if (withinReport) {
    return (
      <button
        type="button"
        className="secondary"
        disabled={disabled}
        onClick={() =>
          document
            .getElementById(MISSED_TRADES_PANEL_ID)
            ?.scrollIntoView({ block: "start" })
        }
      >
        {m.missedTrades}
      </button>
    );
  }
  return disabled ? (
    <button type="button" className="secondary" disabled>
      {m.missedTrades}
    </button>
  ) : (
    <a className="action-link secondary" href={PAGE_HASHES[PAGE.MISSED_TRADES]}>
      {m.missedTrades}
    </a>
  );
}

export function MissedTradesPanel({
  from,
  through,
  initialDay,
  showBreakdown,
}: MissedTradesPanelProps) {
  const { format } = useLocale();
  const m = usePlanningMessages();
  const misses = useJournal((state) => state.workspace.missedTrades);
  const trades = useJournal((state) => state.trades);
  const positions = useJournal((state) => state.positions);
  const executed = useMemo(
    () => executedPlanIds({ trades: trades ?? [], positions }),
    [trades, positions],
  );
  const visible = useMemo(
    () =>
      misses
        .filter(({ missedAt }) => {
          const day = localDay(missedAt);
          return (!from || day >= from) && (!through || day <= through);
        })
        .toSorted((a, b) => b.missedAt.localeCompare(a.missedAt)),
    [misses, from, through],
  );
  const statistics = useMemo(
    () => missedStatistics(visible, executed),
    [visible, executed],
  );
  const { count, assessed, withCash, netR, cash } = statistics.total;
  return (
    <Panel
      id={MISSED_TRADES_PANEL_ID}
      title={m.missedTrades}
      detail={
        <div className="workspace-actions">
          {!showBreakdown && (
            <a className="record-link" href={PAGE_HASHES[PAGE.MISSED_TRADES]}>
              {m.missedAnalytics}
            </a>
          )}
          <a
            className="action-link secondary"
            href={newMissedTradeHref(initialDay)}
          >
            ＋ {m.newMissed}
          </a>
        </div>
      }
    >
      {visible.length ? (
        <div className="layout">
          {count > 0 && (
            <MetricGrid label={m.fromJournal} compact>
              <MetricCard
                label={m.fromJournal}
                value={format.integer.format(count)}
                icon="CLOCK"
                tone={METRIC_TONE.NEUTRAL}
                detail={
                  <>
                    <span>
                      {m.beAssessed} · {format.integer.format(assessed)}/
                      {format.integer.format(count)}
                    </span>
                    <MetricBar
                      segments={[
                        { tone: METRIC_TONE.ACCENT, ratio: assessed / count },
                      ]}
                    />
                  </>
                }
              />
              <MetricCard
                label={m.netR}
                value={
                  netR === null ? EMPTY_VALUE : format.money.format(netR) + " R"
                }
                tone={numericTone(netR ?? 0)}
                icon="TREND"
              />
              <MetricCard
                label={m.estimatedPnl}
                value={
                  cash === null ? EMPTY_VALUE : format.money.format(cash / 100)
                }
                tone={numericTone(cash ?? 0)}
                icon="WALLET"
                detail={
                  withCash < assessed
                    ? `${m.missingRisk} · ${format.integer.format(assessed - withCash)}`
                    : undefined
                }
              />
            </MetricGrid>
          )}
          <MissedTradesTable records={visible} executed={executed} />
          {showBreakdown && count > 0 && (
            <MissedBreakdown statistics={statistics} />
          )}
          <BreakevenReviewSummary records={visible} />
        </div>
      ) : (
        <p>{m.noMisses}</p>
      )}
    </Panel>
  );
}
