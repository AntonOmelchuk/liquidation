import { estimatedMissedCents } from "@liquidation/domain/analytics/plan-performance";
import { TRADE_SIDE } from "@liquidation/domain/trades/constants";
import {
  MISSED_REASON,
  MISSED_REASONS,
  WORKSPACE_RECORD,
  WORKSPACE_TEXT_LIMIT,
} from "@liquidation/domain/workspace/constants";
import { useState } from "react";
import type { FormEvent } from "react";
import {
  isoToLocalDateTime,
  localDateTimeToIso,
} from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import {
  collectScreenshots,
  existingScreenshots,
} from "../../../shared/screenshots/draft.ts";
import { ScreenshotField } from "../../../shared/screenshots/screenshot-field.tsx";
import { InstrumentPicker } from "../../../shared/ui/instrument-picker.tsx";
import { SelectField } from "../../../shared/ui/select-field.tsx";
import { useHistoricalPlanOptions } from "../../journal/data/references.ts";
import { useJournal } from "../../journal/data/store.ts";
import { useTrashMessages } from "../../trash/messages.ts";
import { formText } from "../form.ts";
import { useWorkspaceSave } from "../use-workspace-save.ts";
import {
  WorkspaceFeedback,
  WorkspaceSaveButton,
} from "../workspace-feedback.tsx";
import { usePlanningMessages } from "./messages.ts";
import type { MissedEditorProps } from "./types.ts";

export function MissedEditor({
  entry,
  initialDay,
  onClose,
}: MissedEditorProps) {
  const m = usePlanningMessages();
  const d = useTrashMessages();
  const { t, format } = useLocale();
  const [id] = useState(() => entry?.id ?? crypto.randomUUID());
  const [revision] = useState(entry?.revision);
  const [symbol, setSymbol] = useState(entry?.symbol ?? "");
  const [direction, setDirection] = useState(
    entry?.direction ?? TRADE_SIDE.LONG,
  );
  const [planId, setPlanId] = useState(entry?.planId ?? "");
  const [assessed, setAssessed] = useState(Boolean(entry?.outcome));
  const [images, setImages] = useState(() =>
    existingScreenshots(entry?.screenshotIds),
  );
  const [netR, setNetR] = useState(entry?.outcome?.netR?.toString() ?? "");
  const [risk, setRisk] = useState(entry?.outcome?.risk?.toString() ?? "");
  const { save, status, saving } = useWorkspaceSave();
  const allPlans = useHistoricalPlanOptions(entry?.planId);
  const activePlans = useJournal((state) => state.plans);
  const otherMisses = useJournal((state) => state.workspace.missedTrades);
  const plans = allPlans.filter(
    (plan) =>
      plan.id === entry?.planId ||
      (plan.setup.symbol === symbol.trim().toUpperCase() &&
        plan.setup.direction === direction &&
        !otherMisses.some((miss) => miss.id !== id && miss.planId === plan.id)),
  );
  const linked = plans.find((plan) => plan.id === planId);
  const now = isoToLocalDateTime(new Date().toISOString());
  const seed = initialDay ? initialDay + now.slice(10) : now;
  const preview =
    netR.trim() &&
    risk.trim() &&
    Number.isFinite(Number(netR)) &&
    Number.isFinite(Number(risk)) &&
    Number(risk) > 0
      ? estimatedMissedCents({
          closedAt: "",
          netR: Number(netR),
          risk: Number(risk),
        })
      : null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = {
      symbol,
      direction,
      missedAt: localDateTimeToIso(form.get("missedAt"), entry?.missedAt),
      reason: formText(form, "reason"),
      notes: formText(form, "notes"),
      planId: linked?.id,
      outcome: assessed
        ? {
            closedAt: localDateTimeToIso(
              form.get("closedAt"),
              entry?.outcome?.closedAt,
            ),
            netR: Number(netR),
            risk: risk.trim() ? Number(risk) : undefined,
          }
        : null,
      screenshotIds: images.map(({ id }) => id),
    };
    if (
      await save(
        { record: WORKSPACE_RECORD.MISSED, id, revision, input },
        collectScreenshots([images]),
      )
    )
      onClose();
  }

  return (
    <form className="layout" onSubmit={(event) => void submit(event)}>
      <fieldset className="planning-fields" disabled={saving}>
        <div className="record-field-grid">
          <InstrumentPicker value={symbol} onChange={setSymbol} />
          <SelectField
            label={t.side}
            value={direction}
            onChange={(event) =>
              setDirection(
                event.target.value === TRADE_SIDE.SHORT
                  ? TRADE_SIDE.SHORT
                  : TRADE_SIDE.LONG,
              )
            }
          >
            <option value={TRADE_SIDE.LONG}>{t.long}</option>
            <option value={TRADE_SIDE.SHORT}>{t.short}</option>
          </SelectField>
          <label>
            {m.missedAt}
            <input
              type="datetime-local"
              name="missedAt"
              required
              defaultValue={entry ? isoToLocalDateTime(entry.missedAt) : seed}
            />
          </label>
          <SelectField
            label={m.reason}
            name="reason"
            defaultValue={entry?.reason ?? MISSED_REASON.FEAR}
          >
            {MISSED_REASONS.map((reason) => (
              <option key={reason} value={reason}>
                {m[reason]}
              </option>
            ))}
          </SelectField>
          <SelectField
            label={t.linkedPlan}
            value={linked?.id ?? ""}
            onChange={(event) => setPlanId(event.target.value)}
          >
            <option value="">{t.noLinkedPlan}</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.setup.title}
                {!activePlans.some(({ id }) => id === plan.id) &&
                  " · " + d.deleted}
              </option>
            ))}
          </SelectField>
          <label className="wide">
            {t.notes}
            <textarea
              name="notes"
              rows={5}
              maxLength={WORKSPACE_TEXT_LIMIT}
              defaultValue={entry?.notes}
            />
          </label>
        </div>
        <ScreenshotField
          value={images}
          onChange={setImages}
          disabled={saving}
        />
        <div className="missed-estimate">
          <label className="workspace-check">
            <input
              type="checkbox"
              checked={assessed}
              onChange={(event) => setAssessed(event.target.checked)}
            />
            {m.hypothetical}
          </label>
          {assessed && (
            <div className="record-field-grid">
              <label>
                {m.hypotheticalExit}
                <input
                  type="datetime-local"
                  name="closedAt"
                  required
                  defaultValue={
                    entry?.outcome
                      ? isoToLocalDateTime(entry.outcome.closedAt)
                      : undefined
                  }
                />
              </label>
              <label>
                {m.netR}
                <input
                  type="number"
                  name="netR"
                  step="any"
                  required
                  value={netR}
                  onChange={(event) => setNetR(event.target.value)}
                />
              </label>
              <label>
                {m.estimatedRisk}
                <input
                  type="number"
                  name="risk"
                  min={0.01}
                  max={1000000000}
                  step="0.01"
                  value={risk}
                  onChange={(event) => setRisk(event.target.value)}
                />
              </label>
              {preview !== null && Number.isSafeInteger(preview) && (
                <div>
                  <small>{m.estimatedPnl}</small>
                  <strong>{format.money.format(preview / 100)}</strong>
                </div>
              )}
            </div>
          )}
          <p>{m.missedHint}</p>
        </div>
      </fieldset>
      <WorkspaceFeedback status={status} />
      <div className="workspace-actions">
        <WorkspaceSaveButton saving={saving} />
        <button
          className="secondary"
          type="button"
          disabled={saving}
          onClick={onClose}
        >
          {t.cancel}
        </button>
      </div>
    </form>
  );
}
