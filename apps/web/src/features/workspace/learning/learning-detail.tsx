import { DateText } from "../../../shared/ui/date-text.tsx";
import { ICON_ACTION } from "../../../shared/ui/constants.ts";
import { IconAction } from "../../../shared/ui/icon-action.tsx";
import { TRASH_KIND } from "@liquidation/domain/journal/trash/constants";
import { LEARNING_KIND } from "@liquidation/domain/workspace/constants";
import type { LearningEntry } from "@liquidation/domain/workspace/types";
import { learningHref } from "../../../app/page.ts";
import { ScreenshotGallery } from "../../../shared/screenshots/screenshot-gallery.tsx";
import { DeleteRecord } from "../../trash/delete-record.tsx";
import { useWorkspaceMessages } from "../messages.ts";
import { LearningTags } from "./learning-tags.tsx";
import { LectureDocument } from "./lecture-blocks.tsx";

export function LearningDetail({ entry }: { entry: LearningEntry }) {
  const m = useWorkspaceMessages();
  const lecture = entry.kind === LEARNING_KIND.LESSON;

  return (
    <main className="workspace-page learning-document">
      <a className="record-back" href={learningHref(entry.kind)}>
        ← {lecture ? m.lectures : m.notesPage}
      </a>
      <div className="page-heading learning-heading">
        <div>
          <h1>{entry.title}</h1>
          <LearningTags entry={entry} />
          <p className="learning-meta">
            {entry.group && <span>{entry.group}</span>}
            <DateText value={entry.updatedAt} withTime />
            {lecture && entry.completed && <span>{m.completed}</span>}
          </p>
        </div>
        <div className="workspace-actions">
          <DeleteRecord
            kind={TRASH_KIND.LEARNING}
            recordKey={entry.id}
            revision={entry.revision}
            afterDelete={() => {
              window.location.hash = learningHref(entry.kind);
            }}
          />
          <IconAction
            icon={ICON_ACTION.EDIT}
            label={m.edit}
            href={learningHref(entry.kind, entry.id, true)}
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
        </div>
      </div>
      <article className="panel">
        {lecture ? (
          <LectureDocument entry={entry} />
        ) : (
          <>
            {entry.body && <p className="record-prose">{entry.body}</p>}
            <ScreenshotGallery ids={entry.screenshotIds} />
          </>
        )}
      </article>
    </main>
  );
}
