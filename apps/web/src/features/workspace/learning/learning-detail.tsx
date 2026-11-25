import { TRASH_KIND } from "@liquidation/domain/journal/trash/constants";
import {
  LEARNING_KIND,
  WORKSPACE_RECORD,
} from "@liquidation/domain/workspace/constants";
import type { LearningEntry } from "@liquidation/domain/workspace/types";
import { learningHref } from "../../../app/page.ts";
import { useLocale } from "../../../shared/messages.ts";
import { DeleteRecord } from "../../trash/delete-record.tsx";
import { useWorkspaceMessages } from "../messages.ts";
import { useWorkspaceSave } from "../use-workspace-save.ts";
import { WorkspaceFeedback } from "../workspace-feedback.tsx";
import { LectureDocument } from "./lecture-blocks.tsx";
import { useLearningMessages } from "./messages.ts";

export function LearningDetail({ entry }: { entry: LearningEntry }) {
  const { format } = useLocale();
  const m = useWorkspaceMessages();
  const l = useLearningMessages();
  const { save, saving, status } = useWorkspaceSave();
  const lecture = entry.kind === LEARNING_KIND.LESSON;

  function toggleArchive() {
    return save({
      record: WORKSPACE_RECORD.LEARNING,
      id: entry.id,
      revision: entry.revision,
      input: { ...entry, archived: !entry.archived },
    });
  }

  return (
    <main className="workspace-page learning-document">
      <a className="record-back" href={learningHref(entry.kind)}>
        ← {lecture ? m.lectures : m.notesPage}
      </a>
      <div className="page-heading learning-heading">
        <div>
          <h1>{entry.title}</h1>
          <p className="learning-meta">
            {entry.group && <span>{entry.group}</span>}
            <time dateTime={entry.updatedAt}>
              {format.date.format(Date.parse(entry.updatedAt))}
            </time>
            {entry.completed && <span>{m.completed}</span>}
            {entry.archived && <span>{l.archived}</span>}
          </p>
        </div>
        <div className="workspace-actions">
          <DeleteRecord
            kind={TRASH_KIND.LEARNING}
            recordKey={entry.id}
            revision={entry.revision}
            disabled={saving}
            afterDelete={() => {
              window.location.hash = learningHref(entry.kind);
            }}
          />
          {entry.link && (
            <a
              className="record-link"
              href={entry.link}
              target="_blank"
              rel="noreferrer"
            >
              {m.source} ↗
            </a>
          )}
          <a
            className="action-link secondary"
            href={learningHref(entry.kind, entry.id, true)}
          >
            {m.edit}
          </a>
          <button
            className="secondary"
            type="button"
            disabled={saving}
            onClick={() => void toggleArchive()}
          >
            {entry.archived ? m.restore : m.archive}
          </button>
        </div>
      </div>
      <WorkspaceFeedback status={status} />
      <article className="panel">
        {lecture ? (
          <LectureDocument entry={entry} />
        ) : (
          <p className="record-prose">{entry.body}</p>
        )}
      </article>
    </main>
  );
}
