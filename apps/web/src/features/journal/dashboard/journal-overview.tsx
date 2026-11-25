import { TRASH_KIND } from "@liquidation/domain/journal/trash/constants";
import { trashRecordKey } from "@liquidation/domain/journal/trash/trash";
import { isOpenPlan } from "@liquidation/domain/plans/plan-lifecycle";
import {
  PERIOD,
  PREPARATION_FIELDS,
  PREPARATION_PERIODS,
} from "@liquidation/domain/workspace/constants";
import {
  calendarDate,
  periodBounds,
} from "@liquidation/domain/workspace/period";
import type { PreparationPeriod } from "@liquidation/domain/workspace/types";
import { useState } from "react";
import { PAGE_HASHES } from "../../../app/constants.ts";
import { planHref, reportHref } from "../../../app/page.ts";
import { useLocale } from "../../../shared/messages.ts";
import { CheckboxField } from "../../../shared/ui/checkbox-field.tsx";
import { InstrumentIcons } from "../../../shared/ui/instrument-picker.tsx";
import { Panel } from "../../../shared/ui/layout.tsx";
import { CalendarPanel } from "../../market/calendar-panel.tsx";
import { PlanStatusChip } from "../../plans/details/plan-facts.tsx";
import { DeleteRecord } from "../../trash/delete-record.tsx";
import { useWorkspaceMessages } from "../../workspace/messages.ts";
import {
  DailyThoughtsPanel,
  WeeklyWatchlistPanel,
} from "../../workspace/planning/dashboard-planning.tsx";
import { useJournal } from "../data/store.ts";
import { PreparationEditor } from "./preparation-editor.tsx";

export function JournalOverview({ today }: { today: string }) {
  const [kind, setKind] = useState<PreparationPeriod>(PERIOD.DAY);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const { t, format } = useLocale();
  const m = useWorkspaceMessages();
  const { start, through } = periodBounds(kind, today);
  const period =
    kind === PERIOD.DAY
      ? format.day.format(calendarDate(start))
      : format.day.formatRange(calendarDate(start), calendarDate(through));
  const plans = useJournal((state) => state.plans);
  const preparation = useJournal((state) =>
    state.workspace.preparations.find(
      (entry) => entry.kind === kind && entry.start === start,
    ),
  );
  const hasTodayDrc = useJournal((state) =>
    state.workspace.reports.some(
      (entry) => entry.kind === PERIOD.DAY && entry.start === today,
    ),
  );
  const active = plans.filter((plan) => {
    const first = plan.setup.startsOn;
    const last = plan.setup.endsOn ?? first;
    return (
      isOpenPlan(plan) &&
      (!first || first <= through) &&
      (!last || last >= start)
    );
  });
  return (
    <div className="dashboard-split">
      <div className="layout">
        <DailyThoughtsPanel today={today} />
        <Panel
          title={kind === PERIOD.DAY ? m.preparation : m.weeklyPreparation}
          detail={period}
        >
          <div className="workspace-actions">
            {PREPARATION_PERIODS.map((value) => (
              <button
                key={value}
                type="button"
                className="secondary"
                aria-pressed={value === kind}
                disabled={editing}
                onClick={() => {
                  setKind(value);
                  setSaved(false);
                }}
              >
                {value === PERIOD.DAY ? m.today : m.thisWeek}
              </button>
            ))}
            <div className="dashboard-review-link">
              <a className="record-link" href={reportHref(kind, today)}>
                {kind === PERIOD.DAY ? m.reviewDaily : m.reviewWeekly} →
              </a>
              {kind === PERIOD.DAY && hasTodayDrc && (
                <span className="dashboard-review-badge">
                  <span aria-hidden="true">✓</span> {m.drcSaved}
                </span>
              )}
            </div>
          </div>
          {editing ? (
            <PreparationEditor
              key={start + kind}
              kind={kind}
              start={start}
              preparation={preparation}
              onClose={(success) => {
                setEditing(false);
                setSaved(Boolean(success));
              }}
            />
          ) : (
            <>
              <dl className="workspace-notes">
                {PREPARATION_FIELDS.map(
                  (field) =>
                    preparation?.[field] && (
                      <div key={field}>
                        <dt>{m[field]}</dt>
                        <dd>{preparation[field]}</dd>
                      </div>
                    ),
                )}
              </dl>
              {preparation?.tasks.length ? (
                <div>
                  <h3>{m.tasks}</h3>
                  <ul className="dashboard-task-list">
                    {preparation.tasks.map(({ id, text, done }) => (
                      <li key={id}>
                        <CheckboxField checked={done} disabled>
                          {text}
                        </CheckboxField>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {!preparation && <p>{m.preparationEmpty}</p>}
              {saved && (
                <p className="positive" role="status">
                  {m.saved}
                </p>
              )}
              <button
                type="button"
                className="secondary"
                onClick={() => setEditing(true)}
              >
                {m.editPreparation}
              </button>
              {preparation && (
                <DeleteRecord
                  kind={TRASH_KIND.PREPARATION}
                  recordKey={trashRecordKey(preparation)}
                  revision={preparation.revision}
                />
              )}
            </>
          )}
        </Panel>
        <CalendarPanel />
      </div>
      <div className="layout">
        <WeeklyWatchlistPanel today={today} />
        <Panel title={m.activePlans} detail={active.length}>
          {active.length ? (
            <ul className="dashboard-plan-list">
              {active.slice(0, 8).map((plan) => (
                <li key={plan.id}>
                  <div className="dashboard-plan-heading">
                    <div className="dashboard-plan-identity">
                      <a className="record-link" href={planHref(plan.id)}>
                        {plan.setup.title}
                      </a>
                      <span className="instrument-label">
                        <InstrumentIcons symbol={plan.setup.symbol} />
                        {plan.setup.symbol}
                      </span>
                    </div>
                    <PlanStatusChip plan={plan} compact />
                  </div>
                  {plan.setup.entryCondition && (
                    <p className="record-prose">{plan.setup.entryCondition}</p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>{m.noActivePlans}</p>
          )}
          <a className="record-link" href={PAGE_HASHES.plans}>
            {t.plansNav} →
          </a>
        </Panel>
      </div>
    </div>
  );
}
