import {
  PERIOD,
  REPORT_FIELDS,
  REPORT_GRADES,
  REPORT_PROGRESS_MAX,
  WORKSPACE_RECORD,
  WORKSPACE_TEXT_LIMIT,
} from "@liquidation/domain/workspace/constants";
import { useId, useState } from "react";
import type { FormEvent } from "react";
import { useLocale } from "../../../shared/messages.ts";
import { Panel } from "../../../shared/ui/layout.tsx";
import {
  collectScreenshots,
  existingScreenshots,
} from "../../../shared/screenshots/draft.ts";
import { ScreenshotField } from "../../../shared/screenshots/screenshot-field.tsx";
import { SelectField } from "../../../shared/ui/select-field.tsx";
import { formText, formTexts } from "../form.ts";
import { useWorkspaceMessages } from "../messages.ts";
import { useWorkspaceSave } from "../use-workspace-save.ts";
import {
  WorkspaceFeedback,
  WorkspaceSaveButton,
} from "../workspace-feedback.tsx";
import { AssessmentFields } from "./assessment-fields.tsx";
import {
  GRADE_MAX,
  PRIMARY_REPORT_FIELDS,
  EXTRA_REPORT_FIELDS,
  REPORT_LESSON_FIELD,
} from "./constants.ts";
import type { ReportFormProps, ReportTextField } from "./types.ts";
import "./report-editor.css";

export function ReportEditor({
  report,
  period,
  start,
  candidates,
  dateField,
  dateLinks,
  net,
  tradeCount,
  onClose,
}: ReportFormProps) {
  const m = useWorkspaceMessages();
  const { t, format } = useLocale();
  const [grades, setGrades] = useState(report?.assessments ?? []);
  const [revision] = useState(report?.revision);
  const [images, setImages] = useState(() =>
    existingScreenshots(report?.screenshotIds),
  );
  const { status, save, saving } = useWorkspaceSave();
  const gradesId = useId();
  const graded = period === PERIOD.DAY || period === PERIOD.WEEK;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const progress = formText(form, "progress");
    const written = formText(form, "writtenPnl");
    const input = {
      ...formTexts(form, REPORT_FIELDS),
      grade: formText(form, "grade"),
      quality: formText(form, "quality"),
      progress: progress ? Number(progress) : undefined,
      writtenPnl: written ? Number(written) : undefined,
      screenshotIds: images.map(({ id }) => id),
      bestTradeId: formText(form, "bestTradeId") || undefined,
      assessments: grades.filter(
        ({ grade, note }) => grade.trim() || note.trim(),
      ),
    };
    if (
      await save(
        {
          record: WORKSPACE_RECORD.REPORT,
          kind: period,
          start,
          revision,
          input,
        },
        collectScreenshots([images]),
      )
    ) {
      onClose(true);
    }
  }

  function textField(field: ReportTextField, rows = 4, hideLabel = false) {
    return (
      <label className="report-text-field" key={field}>
        <span className={hideLabel ? "visually-hidden" : undefined}>
          {field === REPORT_LESSON_FIELD ? m.keyLesson : m[field]}
        </span>
        <textarea
          name={field}
          maxLength={WORKSPACE_TEXT_LIMIT}
          rows={rows}
          defaultValue={report?.[field]}
        />
      </label>
    );
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="report-editor">
      <fieldset disabled={saving} className="report-editor-sections">
        <datalist id={gradesId}>
          {REPORT_GRADES.map((grade) => (
            <option key={grade} value={grade} />
          ))}
        </datalist>
        <Panel title={m[period]} detail={dateLinks}>
          <div className="report-meta-grid">
            {dateField}
            <label>
              {m.processGrade}
              <input
                name="grade"
                maxLength={GRADE_MAX}
                list={gradesId}
                defaultValue={report?.grade}
              />
            </label>
            <label>
              {m.reportNet}
              <output className="report-net">{format.money.format(net)}</output>
            </label>
            <label>
              {m.quality}
              <input
                name="quality"
                maxLength={GRADE_MAX}
                list={gradesId}
                defaultValue={report?.quality}
              />
            </label>
            <label>
              {m.writtenPnl}
              <input
                name="writtenPnl"
                type="number"
                step="0.01"
                defaultValue={report?.writtenPnl}
              />
            </label>
            {period === PERIOD.WEEK && (
              <label>
                {m.progress}
                <input
                  name="progress"
                  type="number"
                  min={1}
                  max={REPORT_PROGRESS_MAX}
                  step={1}
                  defaultValue={report?.progress}
                />
              </label>
            )}
          </div>
          <p className="report-trade-count">
            {t.count} · {format.integer.format(tradeCount)}
          </p>
        </Panel>
        <Panel title={m.reportReflection}>
          <div className="report-text-stack">
            {PRIMARY_REPORT_FIELDS.map((field) => textField(field))}
          </div>
        </Panel>
        <div className={graded ? "report-trade-grid" : undefined}>
          <Panel title={m.best}>
            <div className="report-text-stack">
              <SelectField
                name="bestTradeId"
                label={m.pickBest}
                defaultValue={report?.bestTradeId ?? ""}
              >
                <option value="">{m.noSelection}</option>
                {candidates.map(({ id, symbol, direction, openedAt }) => (
                  <option key={id} value={id}>
                    {symbol} · {t[direction]} ·{" "}
                    {format.date.format(Date.parse(openedAt))}
                  </option>
                ))}
              </SelectField>
              {textField("best", 7, true)}
            </div>
          </Panel>
          {graded && (
            <Panel title={m.assessments}>
              <AssessmentFields
                candidates={candidates}
                grades={grades}
                onChange={setGrades}
              />
            </Panel>
          )}
        </div>
        <details
          className="panel report-additional"
          open={EXTRA_REPORT_FIELDS.some((field) => Boolean(report?.[field]))}
        >
          <summary>{m.reportAdditional}</summary>
          <div className="report-text-stack">
            {EXTRA_REPORT_FIELDS.map((field) => textField(field))}
          </div>
        </details>
        <Panel title={m.overview}>
          {textField("overview", 5, true)}
          <ScreenshotField
            value={images}
            onChange={setImages}
            disabled={saving}
          />
        </Panel>
      </fieldset>
      <WorkspaceFeedback status={status} />
      <div className="workspace-actions">
        <WorkspaceSaveButton saving={saving} />
        <button
          type="button"
          className="secondary"
          disabled={saving}
          onClick={() => onClose()}
        >
          {t.cancel}
        </button>
      </div>
    </form>
  );
}
