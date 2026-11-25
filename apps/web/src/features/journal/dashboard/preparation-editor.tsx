import {
  PREPARATION_FIELDS,
  TASK_LIMIT,
  TASK_TEXT_LIMIT,
  WORKSPACE_RECORD,
  WORKSPACE_TEXT_LIMIT,
} from "@liquidation/domain/workspace/constants";
import { useState } from "react";
import type { FormEvent } from "react";
import { useLocale } from "../../../shared/messages.ts";
import { CheckboxField } from "../../../shared/ui/checkbox-field.tsx";
import { formTexts } from "../../workspace/form.ts";
import { useWorkspaceMessages } from "../../workspace/messages.ts";
import { useWorkspaceSave } from "../../workspace/use-workspace-save.ts";
import {
  WorkspaceFeedback,
  WorkspaceSaveButton,
} from "../../workspace/workspace-feedback.tsx";
import type { PreparationEditorProps } from "./types.ts";

export function PreparationEditor({
  preparation,
  kind,
  start,
  onClose,
}: PreparationEditorProps) {
  const { t } = useLocale();
  const m = useWorkspaceMessages();
  const [tasks, setTasks] = useState(preparation?.tasks ?? []);
  const { status, save, saving } = useWorkspaceSave();
  const [revision] = useState(preparation?.revision);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = {
      ...formTexts(new FormData(event.currentTarget), PREPARATION_FIELDS),
      tasks,
    };
    if (
      await save({
        record: WORKSPACE_RECORD.PREPARATION,
        kind,
        start,
        input,
        revision,
      })
    )
      onClose(true);
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="layout">
      <fieldset disabled={saving} className="record-field-grid">
        {PREPARATION_FIELDS.map((field) => (
          <label key={field}>
            {m[field]}
            <textarea
              name={field}
              rows={3}
              maxLength={WORKSPACE_TEXT_LIMIT}
              defaultValue={preparation?.[field]}
            />
          </label>
        ))}
        <div className="wide dashboard-task-editor">
          <h3>{m.tasks}</h3>
          {tasks.map((task) => (
            <div key={task.id} className="dashboard-task-row">
              <CheckboxField
                aria-label={m.completed + " · " + (task.text || m.task)}
                checked={task.done}
                onChange={(event) =>
                  setTasks(
                    tasks.map((item) =>
                      item.id === task.id
                        ? { ...item, done: event.target.checked }
                        : item,
                    ),
                  )
                }
              />
              <input
                value={task.text}
                required
                maxLength={TASK_TEXT_LIMIT}
                aria-label={m.task}
                onChange={(event) =>
                  setTasks(
                    tasks.map((item) =>
                      item.id === task.id
                        ? { ...item, text: event.target.value }
                        : item,
                    ),
                  )
                }
              />
              <button
                type="button"
                className="secondary"
                aria-label={m.remove + " · " + (task.text || m.task)}
                onClick={() =>
                  setTasks(tasks.filter(({ id }) => id !== task.id))
                }
              >
                ×
              </button>
            </div>
          ))}
          <button
            className="secondary"
            type="button"
            disabled={tasks.length >= TASK_LIMIT}
            onClick={() =>
              setTasks([
                ...tasks,
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
        <button
          type="button"
          className="secondary"
          disabled={saving}
          onClick={() => onClose()}
        >
          {t.cancel}
        </button>
        <WorkspaceSaveButton saving={saving} />
      </div>
    </form>
  );
}
