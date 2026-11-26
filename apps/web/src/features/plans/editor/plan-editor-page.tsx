import { PLAN_ACTION, PLAN_STATUS } from "@liquidation/domain/plans/constants";
import { isPlanOpportunityStatus } from "@liquidation/domain/plans/plan-lifecycle";
import { planCommand } from "@liquidation/domain/plans/plan";
import type { Plan, PlanTradeChange } from "@liquidation/domain/plans/types";
import { useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { PAGE_HASHES, PAGE_VIEW } from "../../../app/constants.ts";
import { planHref } from "../../../app/page.ts";
import {
  isoToLocalDateTime,
  localDateTimeToIso,
} from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import { SCREENSHOT_ERROR } from "../../../shared/screenshots/constants.ts";
import {
  collectScreenshots,
  existingScreenshots,
} from "../../../shared/screenshots/draft.ts";
import { useScreenshotMessages } from "../../../shared/screenshots/messages.ts";
import { ScreenshotField } from "../../../shared/screenshots/screenshot-field.tsx";
import { Panel, RecordActions } from "../../../shared/ui/layout.tsx";
import { JOURNAL_STATUS } from "../../journal/data/constants.ts";
import { useJournal } from "../../journal/data/store.ts";
import { usePlanMessages } from "../messages.ts";
import { PlanUnavailable } from "../plan-unavailable.tsx";
import {
  AnalysisFields,
  analysisDraft,
  emptyAnalysisBlock,
  readAnalysisBlocks,
} from "./analysis-fields.tsx";
import { PlanPlaybookField, readPlanPlaybook } from "./plan-playbook.tsx";
import { PlanReviewFields } from "./plan-review-fields.tsx";
import { planSaveError } from "./plan-save-error.ts";
import {
  PlanExecutionFields,
  PlanHeaderFields,
  PlanSetupDetails,
} from "./plan-setup-fields.tsx";
import { PlanTradeFields } from "./plan-trade-fields.tsx";
import type {
  AnalysisDraft,
  FormError,
  PlanEditorPageProps,
  PlanEditorProps,
} from "./types.ts";

function optionalNumber(value: FormDataEntryValue | null) {
  return value ? Number(value) : undefined;
}

function readReview(
  data: FormData,
  review: Plan[typeof PAGE_VIEW.REVIEW] | undefined,
) {
  const status = data.get("status");
  if (status === PLAN_STATUS.FAILED)
    return { status, reason: data.get("reason") };
  if (!isPlanOpportunityStatus(status)) return { status };

  const time = data.get("missedDate");
  const netR = optionalNumber(data.get("missedNetR"));
  const risk = optionalNumber(data.get("missedRisk"));
  const existing = review && "outcome" in review ? review.outcome : null;
  const closedAt =
    existing && time === isoToLocalDateTime(existing.closedAt)
      ? existing.closedAt
      : localDateTimeToIso(time);
  return {
    status,
    outcome:
      time || netR !== undefined || risk !== undefined
        ? { closedAt, netR, risk }
        : null,
  };
}

function validationMessage(path: readonly PropertyKey[]): FormError {
  if (path.includes("reason")) return "invalidReason";
  if (path.includes("outcome")) return "invalidOutcome";
  if (path.includes("endsOn") || path.includes("startsOn"))
    return "invalidDates";
  if (path.includes("analysis")) return "invalidAnalysis";
  return "invalid";
}

export function PlanEditorPage({ id, section }: PlanEditorPageProps) {
  const plan = useJournal((state) =>
    state.plans.find((item) => item.id === id),
  );
  const status = useJournal((state) => state.status);
  if (status !== JOURNAL_STATUS.READY || (id && !plan))
    return <PlanUnavailable />;
  return <PlanEditor key={id ?? "new"} plan={plan} section={section} />;
}

function PlanEditor({ plan, section }: PlanEditorProps) {
  const { t } = useLocale();
  const p = usePlanMessages();
  const screenshotMessages = useScreenshotMessages();
  const [analysis, setAnalysis] = useState<AnalysisDraft[]>(() =>
    plan?.setup.analysis?.length
      ? analysisDraft(plan.setup.analysis)
      : [emptyAnalysisBlock()],
  );
  const [setupShots, setSetupShots] = useState(() =>
    existingScreenshots(plan?.setup.screenshotIds),
  );
  const [recapShots, setRecapShots] = useState(() =>
    existingScreenshots(plan?.recap?.screenshotIds),
  );
  const [tradeChanges, setTradeChanges] = useState(
    () => new Map<string, PlanTradeChange>(),
  );
  const updatePlan = useJournal((state) => state.updatePlan);
  const heading = useRef<HTMLHeadingElement>(null);
  const reviewSection = useRef<HTMLDivElement>(null);
  const tradesSection = useRef<HTMLDivElement>(null);
  const [id] = useState(() => plan?.id ?? crypto.randomUUID());
  const [revision] = useState(() => plan?.revision);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<FormError | null>(null);

  useLayoutEffect(() => {
    const target =
      section === PAGE_VIEW.REVIEW
        ? reviewSection.current
        : section === PAGE_VIEW.TRADES
          ? tradesSection.current
          : null;
    if (target) {
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: "start" });
    } else {
      window.scrollTo(0, 0);
      heading.current?.focus({ preventScroll: true });
    }
  }, [section]);

  const backHref = plan ? planHref(plan.id) : PAGE_HASHES.plans;

  function changeTrade(change: PlanTradeChange) {
    setTradeChanges((previous) => {
      const next = new Map(previous);
      const existing = previous.get(change.id);
      const previousPlanId = existing
        ? existing.previousPlanId
        : change.previousPlanId;
      if (change.attached === (previousPlanId === id)) next.delete(change.id);
      else next.set(change.id, { ...change, previousPlanId });
      return next;
    });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const data = new FormData(event.currentTarget);
    const setup = {
      title: data.get("title"),
      symbol: data.get("symbol"),
      direction: data.get("direction"),
      entryCondition: data.get("entryCondition"),
      entry: optionalNumber(data.get("entry")),
      stop: optionalNumber(data.get("stop")),
      target: optionalNumber(data.get("target")),
      startsOn: data.get("startsOn") || undefined,
      endsOn: data.get("endsOn") || undefined,
      narrative: data.get("narrative"),
      avoid: data.get("avoid") || undefined,
      playbook: readPlanPlaybook(data),
      analysis: readAnalysisBlocks(analysis),
      screenshotIds: setupShots.length
        ? setupShots.map(({ id }) => id)
        : undefined,
    };
    const recapText = String(data.get("recapText") ?? "").trim();
    const recap =
      recapText || recapShots.length
        ? {
            text: recapText,
            screenshotIds: recapShots.map(({ id }) => id),
          }
        : null;
    const command = planCommand.safeParse(
      plan
        ? {
            action: PLAN_ACTION.EDIT,
            id,
            revision,
            setup,
            review: readReview(data, plan.review),
            recap,
            tradeChanges: [...tradeChanges.values()],
          }
        : {
            action: PLAN_ACTION.CREATE,
            id,
            setup,
            review: readReview(data, undefined),
            tradeChanges: [...tradeChanges.values()],
          },
    );
    if (!command.success) {
      setError(validationMessage(command.error.issues[0].path));
      return;
    }

    const uploads = collectScreenshots([
      setupShots,
      recapShots,
      ...analysis.map(({ screenshots }) => screenshots),
    ]);
    if (!uploads) {
      setError(SCREENSHOT_ERROR.UPLOAD_LIMIT);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updatePlan(command.data, uploads);
      window.location.replace(planHref(id));
    } catch (error) {
      setError(planSaveError(error));
      setSaving(false);
    }
  }

  return (
    <main className="record-editor plan-editor">
      <a className="plan-back" href={backHref}>
        ← {plan ? p.backToPlan : p.back}
      </a>
      <div className="page-heading plan-detail-heading">
        <div>
          <h1 ref={heading} tabIndex={-1}>
            {plan ? p.edit : p.create}
          </h1>
          {plan && <p className="plan-editor-name">{plan.setup.title}</p>}
        </div>
      </div>

      <form className="layout" onSubmit={save}>
        <Panel title={p.overview}>
          <fieldset disabled={saving}>
            <PlanHeaderFields setup={plan?.setup} />
            <PlanPlaybookField initial={plan?.setup.playbook} />
          </fieldset>
        </Panel>
        <div ref={reviewSection} tabIndex={-1} className="plan-editor-section">
          <Panel title={p.review}>
            <fieldset disabled={saving}>
              <PlanReviewFields
                review={plan?.review ?? { status: PLAN_STATUS.WAITING }}
              />
              {plan && (
                <>
                  <label className="wide">
                    {p.recapNotes}
                    <textarea
                      name="recapText"
                      maxLength={4000}
                      rows={5}
                      defaultValue={plan.recap?.text}
                    />
                  </label>
                  <div className="wide">
                    <ScreenshotField
                      value={recapShots}
                      onChange={setRecapShots}
                      disabled={saving}
                    />
                  </div>
                </>
              )}
            </fieldset>
          </Panel>
        </div>
        <div ref={tradesSection} tabIndex={-1} className="plan-editor-section">
          <Panel title={p.linked}>
            <fieldset className="plan-trade-fieldset" disabled={saving}>
              <PlanTradeFields
                planId={id}
                changes={tradeChanges}
                onChange={changeTrade}
              />
            </fieldset>
          </Panel>
        </div>
        <Panel title={p.analysis}>
          <fieldset disabled={saving}>
            <div className="wide">
              <AnalysisFields
                blocks={analysis}
                onChange={setAnalysis}
                saving={saving}
              />
            </div>
          </fieldset>
        </Panel>
        <Panel title={p.execution}>
          <fieldset disabled={saving}>
            <PlanExecutionFields setup={plan?.setup} />
            <div className="wide">
              <ScreenshotField
                value={setupShots}
                onChange={setSetupShots}
                disabled={saving}
              />
            </div>
          </fieldset>
        </Panel>
        {plan?.originalSetup && (
          <details className="plan-original">
            <summary>{p.original}</summary>
            <PlanSetupDetails setup={plan.originalSetup} />
          </details>
        )}
        <RecordActions
          backHref={backHref}
          cancel={t.cancel}
          submit={saving ? t.saving : p.save}
          saving={saving}
          error={
            error
              ? error === SCREENSHOT_ERROR.UPLOAD_LIMIT
                ? screenshotMessages[error]
                : p[error]
              : undefined
          }
        />
      </form>
    </main>
  );
}
