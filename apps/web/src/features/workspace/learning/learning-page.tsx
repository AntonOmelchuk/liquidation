import { LEARNING_KIND } from "@liquidation/domain/workspace/constants";
import type {
  LearningEntry,
  LearningKind,
} from "@liquidation/domain/workspace/types";
import { useMemo, useState } from "react";
import { PAGE_VIEW } from "../../../app/constants.ts";
import { learningHref } from "../../../app/page.ts";
import { useLocale } from "../../../shared/messages.ts";
import { JOURNAL_STATUS } from "../../journal/data/constants.ts";
import { useJournal } from "../../journal/data/store.ts";
import { JournalUnavailable } from "../../journal/journal-unavailable.tsx";
import { useWorkspaceMessages } from "../messages.ts";
import { LearningDetail } from "./learning-detail.tsx";
import { LearningEditor } from "./learning-editor.tsx";
import { groupKey, groupNames, searchableContent } from "./lecture-content.ts";
import { useLearningMessages } from "./messages.ts";
import type { LearningPageProps } from "./types.ts";
import "../workspace.css";
import "./learning.css";

export default function LearningPage({ kind, view, id }: LearningPageProps) {
  const m = useWorkspaceMessages();
  const l = useLearningMessages();
  const entries = useJournal((state) => state.workspace.learning);
  const status = useJournal((state) => state.status);
  const records = useMemo(
    () => entries.filter((entry) => entry.kind === kind),
    [entries, kind],
  );
  const entry = id ? records.find((item) => item.id === id) : undefined;
  const lecture = kind === LEARNING_KIND.LESSON;
  if (status !== JOURNAL_STATUS.READY || (id && !entry)) {
    return (
      <JournalUnavailable
        backHref={learningHref(kind)}
        backLabel={lecture ? m.lectures : m.notesPage}
        missing={lecture ? l.missingLecture : l.missingNote}
      />
    );
  }
  if (view === PAGE_VIEW.NEW || view === PAGE_VIEW.EDIT) {
    return (
      <LearningEditor
        kind={kind}
        entry={entry}
        groups={lecture ? groupNames(records) : []}
      />
    );
  }
  if (entry) return <LearningDetail entry={entry} />;
  return <LearningList kind={kind} records={records} />;
}

function LearningList({
  kind,
  records,
}: {
  kind: LearningKind;
  records: LearningEntry[];
}) {
  const { format } = useLocale();
  const m = useWorkspaceMessages();
  const l = useLearningMessages();
  const [search, setSearch] = useState("");
  const [archived, setArchived] = useState(false);
  const lecture = kind === LEARNING_KIND.LESSON;
  const value = search.trim().toLowerCase();
  const visible = records
    .filter(
      (entry) =>
        entry.archived === archived && searchableContent(entry).includes(value),
    )
    .toSorted(
      (a, b) =>
        Date.parse(b.updatedAt) - Date.parse(a.updatedAt) ||
        a.title.localeCompare(b.title),
    );
  const groups = Map.groupBy(visible, (entry) => groupKey(entry.group));
  const titled = groupNames(visible);

  function renderLectures(items: LearningEntry[]) {
    return (
      <ul className="lecture-group-list">
        {items.map((entry) => (
          <li key={entry.id}>
            <a className="record-link" href={learningHref(kind, entry.id)}>
              {entry.title}
            </a>
            <small>
              {format.date.format(Date.parse(entry.updatedAt))}
              {entry.completed && " · " + m.completed}
            </small>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <main className="workspace-page">
      <div className="page-heading">
        <h1>{lecture ? m.lectures : m.notesPage}</h1>
        <a className="action-link" href={learningHref(kind, PAGE_VIEW.NEW)}>
          ＋ {lecture ? l.newLecture : l.newNote}
        </a>
      </div>
      <div className="journal-filters">
        <label>
          {m.librarySearch}
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label className="workspace-check">
          <input
            type="checkbox"
            checked={archived}
            onChange={(event) => setArchived(event.target.checked)}
          />
          {m.showArchived}
        </label>
      </div>
      {visible.length === 0 ? (
        <p>{m.noEntries}</p>
      ) : lecture ? (
        <div className="lecture-groups">
          {[...titled, ""].map((group) => {
            const items = groups.get(groupKey(group));
            return (
              items && (
                <details key={group} className="panel lecture-group" open>
                  <summary>
                    <span>{group || l.ungrouped}</span>
                    <small>{items.length}</small>
                  </summary>
                  {renderLectures(items)}
                </details>
              )
            );
          })}
        </div>
      ) : (
        <div className="record-card-grid">
          {visible.map((entry) => (
            <article key={entry.id} className="panel learning-entry">
              <div className="panel-heading">
                <h2>
                  <a
                    className="record-link"
                    href={learningHref(kind, entry.id)}
                  >
                    {entry.title}
                  </a>
                </h2>
                <small>{format.date.format(Date.parse(entry.updatedAt))}</small>
              </div>
              {entry.body && (
                <p className="record-prose note-excerpt">{entry.body}</p>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
