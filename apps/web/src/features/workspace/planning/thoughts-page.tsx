import { TRASH_KIND } from "@liquidation/domain/journal/trash/constants";
import {
  WORKSPACE_RECORD,
  WORKSPACE_TEXT_LIMIT,
} from "@liquidation/domain/workspace/constants";
import { calendarDate, localDay } from "@liquidation/domain/workspace/period";
import { useState } from "react";
import type { FormEvent } from "react";
import { PAGE_HASHES } from "../../../app/constants.ts";
import { thoughtHref } from "../../../app/page.ts";
import { useLocale } from "../../../shared/messages.ts";
import {
  collectScreenshots,
  existingScreenshots,
} from "../../../shared/screenshots/draft.ts";
import { ScreenshotField } from "../../../shared/screenshots/screenshot-field.tsx";
import { ScreenshotGallery } from "../../../shared/screenshots/screenshot-gallery.tsx";
import { Panel } from "../../../shared/ui/layout.tsx";
import { JOURNAL_STATUS } from "../../journal/data/constants.ts";
import { useJournal } from "../../journal/data/store.ts";
import { JournalUnavailable } from "../../journal/journal-unavailable.tsx";
import { DeleteRecord } from "../../trash/delete-record.tsx";
import { formText } from "../form.ts";
import { useWorkspaceMessages } from "../messages.ts";
import { useWorkspaceSave } from "../use-workspace-save.ts";
import {
  WorkspaceFeedback,
  WorkspaceSaveButton,
} from "../workspace-feedback.tsx";
import { usePlanningMessages } from "./messages.ts";
import type { ThoughtEditorProps } from "./types.ts";
import "./planning.css";

function ThoughtEditor({ day, entry, onClose }: ThoughtEditorProps) {
  const m = usePlanningMessages();
  const { t } = useLocale();
  const [images, setImages] = useState(() =>
    existingScreenshots(entry?.screenshotIds),
  );
  const [revision] = useState(entry?.revision);
  const { save, status, saving } = useWorkspaceSave();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = {
      text: formText(new FormData(event.currentTarget), "text"),
      screenshotIds: images.map(({ id }) => id),
    };
    if (
      await save(
        { record: WORKSPACE_RECORD.THOUGHT, day, revision, input },
        collectScreenshots([images]),
      )
    )
      onClose();
  }
  return (
    <form className="layout" onSubmit={(event) => void submit(event)}>
      <fieldset className="planning-fields" disabled={saving}>
        <label>
          {m.thought}
          <textarea
            name="text"
            rows={10}
            maxLength={WORKSPACE_TEXT_LIMIT}
            defaultValue={entry?.text}
          />
        </label>
        <ScreenshotField
          value={images}
          onChange={setImages}
          disabled={saving}
        />
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

export default function ThoughtsPage({ day }: { day?: string }) {
  const { t, format } = useLocale();
  const w = useWorkspaceMessages();
  const m = usePlanningMessages();
  const ready = useJournal((state) => state.status === JOURNAL_STATUS.READY);
  const entries = useJournal((state) => state.workspace.thoughts);
  const today = localDay(new Date().toISOString());
  const date = day ?? today;
  const entry = entries.find((item) => item.day === date);
  const [editing, setEditing] = useState(false);
  if (!ready)
    return (
      <JournalUnavailable
        backHref={PAGE_HASHES.journal}
        backLabel={t.backJournal}
        missing={m.noThought}
      />
    );
  return (
    <main className="workspace-page">
      <div className="page-heading">
        <h1>{m.thoughts}</h1>
      </div>
      <div className="layout">
        <Panel
          title={format.day.format(calendarDate(date))}
          detail={
            <div className="workspace-actions">
              {entry && !editing && (
                <DeleteRecord
                  kind={TRASH_KIND.THOUGHT}
                  recordKey={entry.day}
                  revision={entry.revision}
                />
              )}
            </div>
          }
        >
          <div className="journal-filters">
            <label>
              {m.recordDate}
              <input
                type="date"
                value={date}
                disabled={editing}
                onChange={(event) => {
                  if (event.target.value)
                    window.location.hash = thoughtHref(event.target.value);
                }}
              />
            </label>
            {!editing && (
              <a className="record-link" href={thoughtHref(today)}>
                {w.today}
              </a>
            )}
          </div>
          {editing ? (
            <ThoughtEditor
              day={date}
              entry={entry}
              onClose={() => setEditing(false)}
            />
          ) : (
            <>
              {entry ? (
                <>
                  <p className="record-prose">{entry.text}</p>
                  <ScreenshotGallery ids={entry.screenshotIds} />
                </>
              ) : (
                <p>{m.noThought}</p>
              )}
              <button
                type="button"
                className="secondary"
                onClick={() => setEditing(true)}
              >
                {m.writeThought}
              </button>
            </>
          )}
        </Panel>
        <Panel title={m.history}>
          <ul className="workspace-history">
            {entries
              .toSorted((a, b) => b.day.localeCompare(a.day))
              .map((item) => (
                <li key={item.day}>
                  <a className="record-link" href={thoughtHref(item.day)}>
                    {format.day.format(calendarDate(item.day))}
                  </a>
                </li>
              ))}
          </ul>
        </Panel>
      </div>
    </main>
  );
}
