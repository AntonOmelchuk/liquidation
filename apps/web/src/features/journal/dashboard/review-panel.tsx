import { summarize } from "@liquidation/domain/trades/trade";
import { reviewTrades } from "@liquidation/domain/workspace/analytics";
import { PERIOD } from "@liquidation/domain/workspace/constants";
import {
  calendarDate,
  periodBounds,
} from "@liquidation/domain/workspace/period";
import type {
  PreparationPeriod,
  Report,
} from "@liquidation/domain/workspace/types";
import { useMemo, useState } from "react";
import { reportHref } from "../../../app/page.ts";
import { EMPTY_VALUE } from "../../../shared/constants.ts";
import { useLocale } from "../../../shared/messages.ts";
import { Panel } from "../../../shared/ui/layout.tsx";
import { useWorkspaceMessages } from "../../workspace/messages.ts";
import { PeriodSwitcher } from "../../workspace/period-switcher.tsx";
import { useJournal } from "../data/store.ts";

function ReviewSummary({ report }: { report: Report }) {
  const { format } = useLocale();
  const m = useWorkspaceMessages();
  const trades = useJournal((state) => state.trades);
  const { kind, start } = report;
  const { count, net } = useMemo(
    () => summarize(reviewTrades(trades ?? [], kind, start)),
    [trades, kind, start],
  );
  const pnl = report.writtenPnl ?? net;
  const tone = pnl > 0 ? "positive" : pnl < 0 ? "negative" : undefined;
  return (
    <dl className="dashboard-review-summary">
      <div>
        <dt>{m.reviewProcess}</dt>
        <dd>
          <strong>{report.grade || EMPTY_VALUE}</strong>
          {report.process && <p>{report.process}</p>}
        </dd>
      </div>
      <div>
        <dt
          title={report.writtenPnl === undefined ? m.reportNet : m.writtenPnl}
        >
          {m.reviewPnl}
        </dt>
        <dd className={tone}>
          <strong>{format.money.format(pnl)}</strong>
        </dd>
      </div>
      <div>
        <dt title={kind === PERIOD.DAY ? m.dailyBasis : m.weeklyBasis}>
          {m.reviewTradeCount}
        </dt>
        <dd>
          <strong>{format.integer.format(count)}</strong>
        </dd>
      </div>
      <div>
        <dt>{m.reviewOpportunity}</dt>
        <dd>
          <strong>{report.quality || EMPTY_VALUE}</strong>
        </dd>
      </div>
      <div className="dashboard-review-overview">
        <dt>{m.overview}</dt>
        <dd>
          <p>{report.overview || EMPTY_VALUE}</p>
        </dd>
      </div>
    </dl>
  );
}

export function ReviewPanel({ today }: { today: string }) {
  const [period, setPeriod] = useState<PreparationPeriod>(PERIOD.DAY);
  const { format } = useLocale();
  const m = useWorkspaceMessages();
  const { start, through } = periodBounds(period, today);
  const daily = period === PERIOD.DAY;
  const dateLabel = daily
    ? format.day.format(calendarDate(start))
    : format.day.formatRange(calendarDate(start), calendarDate(through));
  const report = useJournal((state) =>
    state.workspace.reports.find(
      (entry) => entry.kind === period && entry.start === start,
    ),
  );
  const href = reportHref(period, start);

  return (
    <Panel
      id="dashboard-review"
      title={daily ? m.dailyReview : m.weeklyReview}
      detail={dateLabel}
    >
      <PeriodSwitcher period={period} onChange={setPeriod} relative />
      {report ? (
        <>
          <ReviewSummary report={report} />
          <div className="workspace-actions">
            <a className="record-link" href={href}>
              {daily ? m.reviewDaily : m.reviewWeekly} →
            </a>
            <span className="dashboard-review-badge">
              <span aria-hidden="true">✓</span>{" "}
              {daily ? m.drcSaved : m.wrcSaved}
            </span>
          </div>
        </>
      ) : (
        <a className="dashboard-review-add" href={href}>
          <span aria-hidden="true">+</span>
          {daily ? m.addDrc : m.addWrc}
        </a>
      )}
    </Panel>
  );
}
