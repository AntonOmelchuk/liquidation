import { ICON_ACTION } from "../../../shared/ui/constants.ts";
import { IconAction } from "../../../shared/ui/icon-action.tsx";
import {
  PREPARATION_FIELDS,
  PREPARATION_OUTLOOK_LIMIT,
  TASK_LIMIT,
  TASK_TEXT_LIMIT,
  WORKSPACE_RECORD,
  WORKSPACE_TEXT_LIMIT,
} from "@liquidation/domain/workspace/constants";
import { useState } from "react";
import type { FormEvent } from "react";
import { useLocale } from "../../../shared/messages.ts";
import {
  collectScreenshots,
  existingScreenshots,
} from "../../../shared/screenshots/draft.ts";
import { ScreenshotField } from "../../../shared/screenshots/screenshot-field.tsx";
import { CheckboxField } from "../../../shared/ui/checkbox-field.tsx";
import { formTexts } from "../form.ts";
import { useWorkspaceMessages } from "../messages.ts";
import { useWorkspaceSave } from "../use-workspace-save.ts";
import {
  WorkspaceFeedback,
  WorkspaceSaveButton,
} from "../workspace-feedback.tsx";
import { thoughtContent } from "./thought-content.ts";
import type { PeriodThoughtsEditorProps } from "./types.ts";

const fieldLimits = {
  outlook: PREPARATION_OUTLOOK_LIMIT,
  news: WORKSPACE_TEXT_LIMIT,
  watch: WORKSPACE_TEXT_LIMIT,
};

export function PeriodThoughtsEditor({
  preparation,
  legacy,
  period,
  start,
  onClose,
}: PeriodThoughtsEditorProps) {
  const { t } = useLocale();
  const m = useWorkspaceMessages();
  const content = thoughtContent(preparation, legacy);
  const [tasks, setTasks] = useState(preparation?.tasks ?? []);
  const [images, setImages] = useState(() =>
    existingScreenshots(content.screenshotIds),
  );
  const [revision] = useState(preparation?.revision);
  const [legacyThoughtRevision] = useState(legacy?.revision);
  const { status, save, saving } = useWorkspaceSave();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      await save(
        {
          record: WORKSPACE_RECORD.PREPARATION,
          kind: period,
          start,
          revision,
          legacyThoughtRevision,
          input: {
            ...formTexts(new FormData(event.currentTarget), PREPARATION_FIELDS),
            tasks,
            screenshotIds: images.map(({ id }) => id),
          },
        },
        collectScreenshots([images]),
      )
    )
      onClose();
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="layout">
      <fieldset disabled={saving} className="planning-fields">
        {PREPARATION_FIELDS.map((field) => (
          <label key={field}>
            {m[field]}
            <textarea
              name={field}
              rows={3}
              maxLength={fieldLimits[field]}
              defaultValue={content[field]}
            />
          </label>
        ))}
        <ScreenshotField
          value={images}
          onChange={setImages}
          disabled={saving}
        />
        <div className="thought-task-editor">
          <h3>{m.tasks}</h3>
          {tasks.map((task) => (
            <div key={task.id} className="thought-task-row">
              <CheckboxField
                aria-label={m.completed + " · " + (task.text || m.task)}
                checked={task.done}
                onChange={(event) => {
                  const { checked } = event.currentTarget;
                  setTasks((items) =>
                    items.map((item) =>
                      item.id === task.id ? { ...item, done: checked } : item,
                    ),
                  );
                }}
              />
              <input
                value={task.text}
                required
                maxLength={TASK_TEXT_LIMIT}
                aria-label={m.task}
                onChange={(event) => {
                  const { value } = event.currentTarget;
                  setTasks((items) =>
                    items.map((item) =>
                      item.id === task.id ? { ...item, text: value } : item,
                    ),
                  );
                }}
              />
              <IconAction
                icon={ICON_ACTION.DELETE}
                label={m.remove + " · " + (task.text || m.task)}
                onClick={() =>
                  setTasks((items) => items.filter(({ id }) => id !== task.id))
                }
              />
            </div>
          ))}
          <button
            className="secondary"
            type="button"
            disabled={tasks.length >= TASK_LIMIT}
            onClick={() =>
              setTasks((items) => [
                ...items,
                { id: crypto.randomUUID(), text: "", done: false },
              ])
            }
          >
            {m.newTask}
          </button>
        </div>
      </fieldset>
      <WorkspaceFeedback status={status} />
      <div className="workspace-actions">
        <WorkspaceSaveButton saving={saving} />
        <button
          type="button"
          className="secondary"
          disabled={saving}
          onClick={onClose}
        >
          {t.cancel}
        </button>
      </div>
    </form>
  );
}
