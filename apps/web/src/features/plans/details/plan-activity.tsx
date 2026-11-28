import { DateText } from "../../../shared/ui/date-text.tsx";
import { ICON_ACTION } from "../../../shared/ui/constants.ts";
import { IconAction } from "../../../shared/ui/icon-action.tsx";
import { PLAN_ACTION, PLAN_EVENT } from "@liquidation/domain/plans/constants";
import type { PlanEvent } from "@liquidation/domain/plans/types";
import { TYPE_NAME } from "@liquidation/domain/shared/constants";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { SCREENSHOT_ERROR } from "../../../shared/screenshots/constants.ts";
import type {
  Activity,
  ActivityFormProps,
  PlanActivityProps,
} from "./types.ts";

import { planCommand } from "@liquidation/domain/plans/plan";
import { useLocale } from "../../../shared/messages.ts";
import {
  collectScreenshots,
  existingScreenshots,
} from "../../../shared/screenshots/draft.ts";
import { useScreenshotMessages } from "../../../shared/screenshots/messages.ts";
import { ScreenshotField } from "../../../shared/screenshots/screenshot-field.tsx";
import { ScreenshotGallery } from "../../../shared/screenshots/screenshot-gallery.tsx";
import { Panel } from "../../../shared/ui/layout.tsx";
import { useJournal } from "../../journal/data/store.ts";
import { planSaveError } from "../editor/plan-save-error.ts";
import { usePlanMessages } from "../messages.ts";

function isUpdate(
  activity: Activity | null,
): activity is Extract<PlanEvent, { kind: typeof PLAN_EVENT.UPDATE }> {
  return activity !== null && typeof activity === TYPE_NAME.OBJECT;
}

export function ActivityForm({ plan, activity, finish }: ActivityFormProps) {
  const p = usePlanMessages();
  const { t } = useLocale();
  const screenshotMessages = useScreenshotMessages();
  const updatePlan = useJournal((state) => state.updatePlan);
  const heading = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  const [revision] = useState(plan.revision);
  const existing = isUpdate(activity) ? activity : undefined;
  const [eventId] = useState(() => existing?.id ?? crypto.randomUUID());
  const [shots, setShots] = useState(() =>
    existingScreenshots(existing?.note.screenshotIds),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<
    | ReturnType<typeof planSaveError>
    | "invalidUpdate"
    | "invalidVoidReason"
    | null
  >(null);
  const writingNote = activity === PLAN_ACTION.ADD_UPDATE || Boolean(existing);
  const title = existing
    ? p.editUpdate
    : activity === PLAN_ACTION.VOID
      ? p.voidPlan
      : activity === PLAN_ACTION.RESTORE
        ? p.restorePlan
        : p.addUpdate;

  useEffect(() => {
    heading.current?.focus();
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const data = new FormData(event.currentTarget);
    const command = planCommand.safeParse({
      id: plan.id,
      revision,
      action: existing ? PLAN_ACTION.EDIT_UPDATE : activity,
      eventId,
      note: {
        text: data.get("text"),
        screenshotIds: shots.map(({ id }) => id),
      },
      reason: data.get("reason"),
    });
    if (!command.success) {
      setError(
        activity === PLAN_ACTION.VOID ? "invalidVoidReason" : "invalidUpdate",
      );
      return;
    }
    const uploads = collectScreenshots([shots]);
    if (!uploads) {
      setError(SCREENSHOT_ERROR.UPLOAD_LIMIT);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updatePlan(command.data, uploads);
      finish();
    } catch (error) {
      setError(planSaveError(error));
      setSaving(false);
    }
  }

  return (
    <section className="timeline-form" aria-labelledby={titleId}>
      <h3 id={titleId} tabIndex={-1} ref={heading}>
        {title}
      </h3>
      <form onSubmit={save}>
        <fieldset disabled={saving}>
          {writingNote && (
            <div className="wide plan-evidence-editor">
              <label>
                {p.updateNotes}
                <textarea
                  name="text"
                  rows={3}
                  maxLength={4000}
                  defaultValue={existing?.note.text}
                />
              </label>
              <ScreenshotField
                value={shots}
                onChange={setShots}
                disabled={saving}
              />
            </div>
          )}
          {activity === PLAN_ACTION.VOID && (
            <label className="wide">
              {p.voidReason}
              <textarea name="reason" rows={3} maxLength={4000} required />
            </label>
          )}
          {error && (
            <p className="wide error" role="alert">
              {error === SCREENSHOT_ERROR.UPLOAD_LIMIT
                ? screenshotMessages.uploadLimit
                : p[error]}
            </p>
          )}
          <div className="wide record-form-actions">
            <button type="button" className="secondary" onClick={finish}>
              {t.cancel}
            </button>
            <button type="submit">{saving ? t.saving : title}</button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}

export function PlanActivity({ plan }: PlanActivityProps) {
  const p = usePlanMessages();
  const [editing, setEditing] = useState<Activity | null>(null);
  const events = plan.events ?? [];

  return (
    <Panel
      title={p.updates}
      detail={
        <button
          type="button"
          className="secondary"
          disabled={Boolean(editing)}
          onClick={() => setEditing(PLAN_ACTION.ADD_UPDATE)}
        >
          {p.addUpdate}
        </button>
      }
    >
      {editing === PLAN_ACTION.ADD_UPDATE && (
        <ActivityForm
          plan={plan}
          activity={editing}
          finish={() => setEditing(null)}
        />
      )}
      {events.length === 0 && !editing && <p>{p.emptyUpdates}</p>}
      {events.length > 0 && (
        <ol className="plan-timeline">
          {events.map((event) => (
            <li key={event.id}>
              <div className="plan-actions">
                <DateText value={event.at} withTime />
                {event.kind === PLAN_EVENT.UPDATE && !editing && (
                  <IconAction
                    icon={ICON_ACTION.EDIT}
                    label={p.editUpdate}
                    onClick={() => setEditing(event)}
                  />
                )}
              </div>
              {event.kind === PLAN_EVENT.UPDATE && (
                <>
                  <p>{event.note.text}</p>
                  <ScreenshotGallery ids={event.note.screenshotIds} />
                </>
              )}
              {event.kind === PLAN_EVENT.VOID && (
                <>
                  <strong>{p.voided}</strong>
                  <p>{event.reason}</p>
                </>
              )}
              {event.kind === PLAN_EVENT.RESTORE && (
                <strong>{p.restored}</strong>
              )}
              {isUpdate(editing) && editing.id === event.id && (
                <ActivityForm
                  plan={plan}
                  activity={editing}
                  finish={() => setEditing(null)}
                />
              )}
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
