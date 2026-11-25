import { TRASH_KIND } from "@liquidation/domain/journal/trash/constants";
import { trashRecordKey } from "@liquidation/domain/journal/trash/trash";
import { getPlanVoiding } from "@liquidation/domain/plans/plan-lifecycle";
import { netCents } from "@liquidation/domain/trades/trade";
import {
  assessmentCandidates,
  newestTrades,
  reviewTrades,
} from "@liquidation/domain/workspace/analytics";
import {
  PERIOD,
  REPORT_FIELDS,
  WORKSPACE_RECORD,
} from "@liquidation/domain/workspace/constants";
import {
  calendarDate,
  localDay,
  periodBounds,
  previousPeriod,
} from "@liquidation/domain/workspace/period";
import type { ReviewPeriod } from "@liquidation/domain/workspace/types";
import { useMemo, useState } from "react";
import { planHref, reportHref } from "../../../app/page.ts";
import { useLocale } from "../../../shared/messages.ts";
import { ScreenshotGallery } from "../../../shared/screenshots/screenshot-gallery.tsx";
import { Panel } from "../../../shared/ui/layout.tsx";
import { useJournal } from "../../journal/data/store.ts";
import { TradeTable } from "../../journal/records/trade-table.tsx";
import { DeleteRecord } from "../../trash/delete-record.tsx";
import {
  MissedTradesPanel,
  MissedTradesShortcut,
} from "../planning/missed-trades-panel.tsx";
import { useWorkspaceMessages } from "../messages.ts";
import { useWorkspaceSave } from "../use-workspace-save.ts";
import { WorkspaceFeedback } from "../workspace-feedback.tsx";
import { SavedAssessments, SubjectResult } from "./assessment-fields.tsx";
import { ComparisonTable } from "./comparison-table.tsx";
import { REPORT_LESSON_FIELD } from "./constants.ts";
import { MistakeSummary } from "./mistake-summary.tsx";
import { PeriodInsights } from "./period-insights.tsx";
import { ReportEditor } from "./report-editor.tsx";

export function PeriodReport({
  period,
  day,
}: {
  period: ReviewPeriod;
  day: string;
}) {
  const m = useWorkspaceMessages();
  const { t, format } = useLocale();
  const { start, through } = periodBounds(period, day);
  const previous = previousPeriod(period, start);
  const trades = useJournal((state) => state.trades);
  const positions = useJournal((state) => state.positions);
  const plans = useJournal((state) => state.plans);
  const reports = useJournal((state) => state.workspace.reports);
  const trash = useJournal((state) => state.trash);
  const highlights = useJournal((state) => state.workspace.highlights);
  const report = reports.find(
    (entry) => entry.kind === period && entry.start === start,
  );
  const [editing, setEditing] = useState(!report);
  const [saved, setSaved] = useState(false);
  const { save, saving, status } = useWorkspaceSave();
  const currentTrades = useMemo(
    () => newestTrades(reviewTrades(trades ?? [], period, start)),
    [trades, period, start],
  );
  const previousTrades = useMemo(
    () => reviewTrades(trades ?? [], period, previous.start),
    [trades, period, previous.start],
  );
  const candidates = useMemo(() => {
    const active = assessmentCandidates(trades ?? [], positions, period, start);
    const ids = new Set(report?.assessments.map(({ id }) => id) ?? []);
    if (report?.bestTradeId) ids.add(report.bestTradeId);
    const known = new Set(active.map(({ id }) => id));
    const historical = trash.flatMap((entry) =>
      (entry.kind === TRASH_KIND.TRADE || entry.kind === TRASH_KIND.POSITION) &&
      ids.has(entry.value.id) &&
      !known.has(entry.value.id)
        ? [entry.value]
        : [],
    );
    return [...active, ...historical].sort(
      (a, b) =>
        Date.parse(b.openedAt) - Date.parse(a.openedAt) ||
        a.id.localeCompare(b.id),
    );
  }, [trades, positions, period, start, trash, report]);
  const best = candidates.find(({ id }) => id === report?.bestTradeId);
  const highlight = highlights.find(({ id }) => id === best?.id);
  const archivedHighlight = trash.some(
    (entry) =>
      entry.kind === TRASH_KIND.HIGHLIGHT && entry.value.id === best?.id,
  );
  const aggregate = period === PERIOD.MONTH || period === PERIOD.QUARTER;
  const span = format.day.formatRange(
    calendarDate(start),
    calendarDate(through),
  );
  const priorSpan = format.day.formatRange(
    calendarDate(previous.start),
    calendarDate(previous.through),
  );
  const weeklyOpen =
    period === PERIOD.WEEK
      ? positions.filter(({ openedAt }) => {
          const opened = localDay(openedAt);
          return opened >= start && opened <= through;
        }).length
      : 0;
  const missed = plans.filter((plan) => {
    if (!("outcome" in plan.review) || getPlanVoiding(plan)) return false;
    const reported = plan.review.outcome
      ? localDay(plan.review.outcome.closedAt)
      : (plan.setup.startsOn ?? localDay(plan.createdAt));
    return reported >= start && reported <= through;
  });
  const savedReports = reports
    .filter((entry) => entry.kind === period)
    .sort((a, b) => b.start.localeCompare(a.start));

  const dateField = (
    <label>
      {m.reportPeriod}
      <input
        type="date"
        value={day}
        onChange={(event) => {
          if (event.target.value)
            window.location.hash = reportHref(period, event.target.value);
        }}
      />
    </label>
  );
  const dateLinks = (
    <div className="workspace-actions">
      <a className="record-link" href={reportHref(period, previous.start)}>
        ← {m.previous}
      </a>
      <a
        className="record-link"
        href={reportHref(period, localDay(new Date().toISOString()))}
      >
        {m.today}
      </a>
      <MissedTradesShortcut />
    </div>
  );
  const performance = (
    <Panel title={editing ? m.reportPerformance : m[period]} detail={span}>
      {!editing && (
        <div className="workspace-actions">
          {dateField}
          {dateLinks}
        </div>
      )}
      <p>
        {period === PERIOD.DAY
          ? m.dailyBasis
          : period === PERIOD.WEEK
            ? m.weeklyBasis
            : m.monthlyBasis}
      </p>
      {period === PERIOD.WEEK && (
        <p>
          {m.weeklyOpen} · {format.integer.format(weeklyOpen)}
        </p>
      )}
      <ComparisonTable
        current={currentTrades}
        previous={previousTrades}
        currentLabel={span}
        previousLabel={priorSpan}
        showChange={
          aggregate && currentTrades.length > 0 && previousTrades.length > 0
        }
      />
    </Panel>
  );

  return (
    <div className="layout">
      {!editing && performance}
      {editing ? (
        <ReportEditor
          report={report}
          period={period}
          start={start}
          candidates={candidates}
          dateField={dateField}
          dateLinks={dateLinks}
          net={
            currentTrades.reduce(
              (result, trade) => result + netCents(trade),
              0,
            ) / 100
          }
          tradeCount={currentTrades.length}
          onClose={(success) => {
            setEditing(false);
            setSaved(Boolean(success));
          }}
        />
      ) : (
        <Panel
          title={m.overview}
          detail={
            <div className="workspace-actions">
              {report && (
                <DeleteRecord
                  kind={TRASH_KIND.REPORT}
                  recordKey={trashRecordKey(report)}
                  revision={report.revision}
                />
              )}
              <button
                className="secondary"
                type="button"
                onClick={() => setEditing(true)}
              >
                {report ? m.edit : m.newReview}
              </button>
            </div>
          }
        >
          {report ? (
            <>
              {saved && (
                <p className="positive" role="status">
                  {m.saved}
                </p>
              )}
              <dl className="workspace-notes">
                {report.grade && (
                  <div>
                    <dt>{m.processGrade}</dt>
                    <dd>{report.grade}</dd>
                  </div>
                )}
                {report.quality && (
                  <div>
                    <dt>{m.quality}</dt>
                    <dd>{report.quality}</dd>
                  </div>
                )}
                {report.progress !== undefined && (
                  <div>
                    <dt>{m.progress}</dt>
                    <dd>{report.progress}/10</dd>
                  </div>
                )}
                {report.writtenPnl !== undefined && (
                  <div>
                    <dt>{m.writtenPnl}</dt>
                    <dd>{format.money.format(report.writtenPnl)}</dd>
                  </div>
                )}
                {REPORT_FIELDS.map(
                  (key) =>
                    report[key] && (
                      <div key={key}>
                        <dt>
                          {key === REPORT_LESSON_FIELD ? m.keyLesson : m[key]}
                        </dt>
                        <dd>{report[key]}</dd>
                      </div>
                    ),
                )}
              </dl>
              <ScreenshotGallery ids={report.screenshotIds} />
              {best && (
                <div className="workspace-actions">
                  <strong>
                    {best.symbol} · {t[best.direction]}
                  </strong>
                  <SubjectResult subject={best} />
                  {"closedAt" in best &&
                    trades?.some(({ id }) => id === best.id) &&
                    !highlight?.featured &&
                    !archivedHighlight && (
                      <button
                        className="secondary"
                        type="button"
                        disabled={saving}
                        onClick={() =>
                          void save({
                            record: WORKSPACE_RECORD.HIGHLIGHT,
                            id: best.id,
                            revision: highlight?.revision,
                            input: {
                              featured: true,
                              note: highlight?.note || report.best,
                              screenshotIds: highlight?.screenshotIds,
                            },
                          })
                        }
                      >
                        {m.feature}
                      </button>
                    )}
                </div>
              )}
              <WorkspaceFeedback status={status} />
              <SavedAssessments
                candidates={candidates}
                grades={report.assessments}
              />
            </>
          ) : (
            <p>{m.reportNone}</p>
          )}
        </Panel>
      )}
      {editing && performance}
      <MissedTradesPanel from={start} through={through} initialDay={day} />
      {aggregate && (
        <>
          <PeriodInsights
            trades={currentTrades}
            period={period}
            start={start}
          />
          <MistakeSummary trades={currentTrades} />
          <Panel title={m.missed}>
            {missed.length ? (
              <ul className="dashboard-plan-list">
                {missed.map(({ id, setup }) => (
                  <li key={id}>
                    <a href={planHref(id)} className="record-link">
                      {setup.title}
                    </a>
                    <small>{setup.symbol}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p>{m.noMissed}</p>
            )}
          </Panel>
        </>
      )}
      <Panel title={t.positions} detail={currentTrades.length}>
        <TradeTable trades={currentTrades} />
      </Panel>
      <Panel title={m.reportSaved} detail={savedReports.length}>
        {savedReports.length ? (
          <ul className="workspace-history">
            {savedReports.map(({ start: date, grade }) => (
              <li key={date}>
                <a
                  href={reportHref(period, date)}
                  className="record-link"
                  aria-current={date === start ? "date" : undefined}
                >
                  {format.day.format(calendarDate(date))}
                </a>
                {grade && <span className="subdued">{grade}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p>{m.reportNone}</p>
        )}
      </Panel>
    </div>
  );
}
