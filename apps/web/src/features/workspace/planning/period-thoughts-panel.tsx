import { TRASH_KIND } from "@liquidation/domain/journal/trash/constants";
import { trashRecordKey } from "@liquidation/domain/journal/trash/trash";
import {
  PERIOD,
  PREPARATION_FIELDS,
  WORKSPACE_RECORD,
} from "@liquidation/domain/workspace/constants";
import {
  calendarDate,
  periodBounds,
} from "@liquidation/domain/workspace/period";
import { useState } from "react";
import { useLocale } from "../../../shared/messages.ts";
import { ScreenshotGallery } from "../../../shared/screenshots/screenshot-gallery.tsx";
import { CheckboxField } from "../../../shared/ui/checkbox-field.tsx";
import { Panel } from "../../../shared/ui/layout.tsx";
import { useJournal } from "../../journal/data/store.ts";
import { DeleteRecord } from "../../trash/delete-record.tsx";
import { WORKSPACE_SAVE } from "../constants.ts";
import { useWorkspaceMessages } from "../messages.ts";
import { PeriodSwitcher } from "../period-switcher.tsx";
import { useWorkspaceSave } from "../use-workspace-save.ts";
import { usePlanningMessages } from "./messages.ts";
import { PeriodThoughtsEditor } from "./period-thoughts-editor.tsx";
import { thoughtContent } from "./thought-content.ts";
import { ThoughtExcerpt } from "./thought-excerpt.tsx";
import type { PeriodThoughtsPanelProps } from "./types.ts";
import "./planning.css";

export function PeriodThoughtsPanel({
  day,
  period,
  onPeriodChange,
  onDayChange,
}: PeriodThoughtsPanelProps) {
  const { format } = useLocale();
  const m = useWorkspaceMessages();
  const p = usePlanningMessages();
  const { start, through } = periodBounds(period, day);
  const daily = period === PERIOD.DAY;
  const span = daily
    ? format.day.format(calendarDate(start))
    : format.day.formatRange(calendarDate(start), calendarDate(through));
  const preparation = useJournal((state) =>
    state.workspace.preparations.find(
      (entry) => entry.kind === period && entry.start === start,
    ),
  );
  const legacy = useJournal((state) =>
    daily
      ? state.workspace.thoughts.find(({ day }) => day === start)
      : undefined,
  );
  const entry = preparation ?? legacy;
  const content = thoughtContent(preparation, legacy);
  const [editing, setEditing] = useState(false);
  const [pendingTask, setPendingTask] = useState<{
    id: string;
    done: boolean;
  }>();
  const { save, saving, status } = useWorkspaceSave();

  async function toggleTask(id: string, done: boolean) {
    if (!preparation || saving) return;
    setPendingTask({ id, done });
    await save({
      record: WORKSPACE_RECORD.PREPARATION,
      kind: period,
      start,
      revision: preparation.revision,
      input: {
        ...preparation,
        tasks: preparation.tasks.map((task) =>
          task.id === id ? { ...task, done } : task,
        ),
      },
    });
    setPendingTask(undefined);
  }

  return (
    <Panel
      id="period-thoughts"
      title={onDayChange ? span : daily ? p.todayThoughts : p.weekThoughts}
      detail={onDayChange ? undefined : span}
    >
      <div className="thought-period-controls">
        <PeriodSwitcher
          period={period}
          relative={!onDayChange}
          disabled={editing || saving}
          onChange={onPeriodChange}
        />
        {onDayChange && (
          <label>
            {daily ? m.date : p.week}
            <input
              type="date"
              value={start}
              disabled={editing || saving}
              onChange={(event) => {
                if (event.currentTarget.value)
                  onDayChange(event.currentTarget.value);
              }}
            />
          </label>
        )}
      </div>
      {editing ? (
        <PeriodThoughtsEditor
          period={period}
          start={start}
          preparation={preparation}
          legacy={legacy}
          onClose={() => setEditing(false)}
        />
      ) : (
        <>
          <dl className="workspace-notes thought-notes">
            {PREPARATION_FIELDS.map(
              (field) =>
                content[field] && (
                  <div key={field}>
                    <dt>{m[field]}</dt>
                    <dd>
                      <ThoughtExcerpt text={content[field]} />
                    </dd>
                  </div>
                ),
            )}
          </dl>
          <ScreenshotGallery ids={content.screenshotIds} />
          {preparation?.tasks.length ? (
            <div className="thought-tasks" aria-busy={saving || undefined}>
              <h3>{m.tasks}</h3>
              <ul className="thought-task-list">
                {preparation.tasks.map(({ id, text, done }) => (
                  <li key={id}>
                    <CheckboxField
                      checked={pendingTask?.id === id ? pendingTask.done : done}
                      disabled={saving}
                      onChange={(event) =>
                        void toggleTask(id, event.currentTarget.checked)
                      }
                    >
                      {text}
                    </CheckboxField>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {status === WORKSPACE_SAVE.CONFLICT && (
            <p className="error" role="alert">
              {m.conflict}
            </p>
          )}
          {status === WORKSPACE_SAVE.ERROR && (
            <p className="error" role="alert">
              {p.taskUpdateError}
            </p>
          )}
          {!entry && <p>{p.noThought}</p>}
          <div className="workspace-actions">
            <button
              type="button"
              className="secondary"
              disabled={saving}
              onClick={() => setEditing(true)}
            >
              {entry ? p.editThought : p.writeThought}
            </button>
            {entry && (
              <DeleteRecord
                kind={preparation ? TRASH_KIND.PREPARATION : TRASH_KIND.THOUGHT}
                recordKey={trashRecordKey(entry)}
                revision={entry.revision}
                legacyThoughtRevision={
                  preparation ? legacy?.revision : undefined
                }
                disabled={saving}
              />
            )}
          </div>
        </>
      )}
    </Panel>
  );
}
