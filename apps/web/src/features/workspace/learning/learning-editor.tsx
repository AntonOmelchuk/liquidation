import {
  LEARNING_KIND,
  LEARNING_TOPIC,
  LECTURE_BLOCK,
  WORKSPACE_RECORD,
  WORKSPACE_TEXT_LIMIT,
  WORKSPACE_TITLE_LIMIT,
} from "@liquidation/domain/workspace/constants";
import { useId, useState } from "react";
import type { FormEvent } from "react";
import { learningHref } from "../../../app/page.ts";
import { useLocale } from "../../../shared/messages.ts";
import {
  collectScreenshots,
  existingScreenshots,
} from "../../../shared/screenshots/draft.ts";
import { ScreenshotField } from "../../../shared/screenshots/screenshot-field.tsx";
import { CheckboxField } from "../../../shared/ui/checkbox-field.tsx";
import { Panel } from "../../../shared/ui/layout.tsx";
import { SelectField } from "../../../shared/ui/select-field.tsx";
import { formText } from "../form.ts";
import { useWorkspaceMessages } from "../messages.ts";
import { useWorkspaceSave } from "../use-workspace-save.ts";
import {
  WorkspaceFeedback,
  WorkspaceSaveButton,
} from "../workspace-feedback.tsx";
import { LectureBlocks } from "./lecture-blocks.tsx";
import { learningNameKey } from "./learning-catalog.ts";
import { lectureBlocksToSave, lectureDraft } from "./lecture-content.ts";
import { useLearningMessages } from "./messages.ts";
import type { LearningEditorProps } from "./types.ts";

export function LearningEditor({
  entry,
  kind,
  groups,
  authors,
}: LearningEditorProps) {
  const { t } = useLocale();
  const m = useWorkspaceMessages();
  const l = useLearningMessages();
  const { save, status, saving } = useWorkspaceSave();
  const [id] = useState(() => entry?.id ?? crypto.randomUUID());
  const [revision] = useState(entry?.revision);
  const [images, setImages] = useState(() =>
    existingScreenshots(entry?.screenshotIds),
  );
  const [blocks, setBlocks] = useState(() =>
    kind === LEARNING_KIND.LESSON ? lectureDraft(entry) : [],
  );
  const groupList = useId();
  const authorList = useId();
  const lecture = kind === LEARNING_KIND.LESSON;
  const backHref = entry ? learningHref(kind, entry.id) : learningHref(kind);
  const section = lecture ? m.lectures : m.notesPage;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const enteredGroup = formText(data, "group");
    const group =
      groups.find(({ key }) => key === learningNameKey(enteredGroup))?.label ??
      enteredGroup;
    const enteredAuthor = formText(data, "author");
    const author =
      authors.find(({ key }) => key === learningNameKey(enteredAuthor))
        ?.label ?? enteredAuthor;
    const input = {
      title: formText(data, "title"),
      kind,
      body: lecture ? "" : formText(data, "body"),
      group: lecture ? group || undefined : undefined,
      topic: formText(data, "topic") || undefined,
      author: author || undefined,
      blocks: lecture ? lectureBlocksToSave(blocks) : undefined,
      screenshotIds: lecture ? undefined : images.map(({ id }) => id),
      link: formText(data, "link") || undefined,
      completed: lecture ? data.has("completed") : entry?.completed,
    };
    const uploads = collectScreenshots(
      lecture
        ? blocks.flatMap((block) =>
            block.type === LECTURE_BLOCK.IMAGE ? [block.images] : [],
          )
        : [images],
    );

    if (
      await save(
        { record: WORKSPACE_RECORD.LEARNING, id, revision, input },
        uploads,
      )
    ) {
      window.location.replace(learningHref(kind, id));
    }
  }

  return (
    <main className="workspace-page learning-document">
      <a className="record-back" href={learningHref(kind)}>
        ← {section}
      </a>
      <div className="page-heading">
        <h1>
          {entry
            ? m.edit + " · " + entry.title
            : lecture
              ? l.newLecture
              : l.newNote}
        </h1>
      </div>
      <form className="layout" onSubmit={(event) => void submit(event)}>
        <fieldset disabled={saving} className="learning-fields">
          <div className="panel record-field-grid">
            <label className="wide">
              {m.title}
              <input
                name="title"
                defaultValue={entry?.title}
                required
                maxLength={WORKSPACE_TITLE_LIMIT}
                autoFocus
              />
            </label>
            {lecture && (
              <label>
                {l.group}
                <input
                  name="group"
                  list={groupList}
                  defaultValue={entry?.group}
                  maxLength={WORKSPACE_TITLE_LIMIT}
                />
                <datalist id={groupList}>
                  {groups.map(({ key, label }) => (
                    <option key={key} value={label} />
                  ))}
                </datalist>
              </label>
            )}
            <SelectField
              label={l.topic}
              name="topic"
              defaultValue={entry?.topic ?? ""}
            >
              <option value="">{l.noTopic}</option>
              {Object.values(LEARNING_TOPIC).map((topic) => (
                <option key={topic} value={topic}>
                  {l.topics[topic]}
                </option>
              ))}
            </SelectField>
            <label>
              {l.author}
              <input
                name="author"
                list={authorList}
                defaultValue={entry?.author}
                maxLength={WORKSPACE_TITLE_LIMIT}
              />
              <datalist id={authorList}>
                {authors.map(({ key, label }) => (
                  <option key={key} value={label} />
                ))}
              </datalist>
            </label>
            <label className="wide">
              {m.sourceUrl}
              <input
                name="link"
                type="url"
                defaultValue={entry?.link}
                maxLength={2048}
                placeholder="https://"
              />
            </label>
            {lecture && (
              <CheckboxField name="completed" defaultChecked={entry?.completed}>
                {m.completed}
              </CheckboxField>
            )}
          </div>
          {lecture ? (
            <Panel title={l.content}>
              <LectureBlocks
                blocks={blocks}
                onChange={setBlocks}
                disabled={saving}
              />
            </Panel>
          ) : (
            <>
              <div className="panel">
                <label>
                  {t.notes}
                  <textarea
                    name="body"
                    defaultValue={entry?.body}
                    rows={12}
                    maxLength={WORKSPACE_TEXT_LIMIT}
                  />
                </label>
              </div>
              <Panel title={l.image}>
                <ScreenshotField
                  value={images}
                  onChange={setImages}
                  disabled={saving}
                />
              </Panel>
            </>
          )}
        </fieldset>
        <WorkspaceFeedback status={status} />
        <div className="workspace-actions">
          {saving ? (
            <button className="secondary" type="button" disabled>
              {t.cancel}
            </button>
          ) : (
            <a className="action-link secondary" href={backHref}>
              {t.cancel}
            </a>
          )}
          <WorkspaceSaveButton saving={saving} />
        </div>
      </form>
    </main>
  );
}
