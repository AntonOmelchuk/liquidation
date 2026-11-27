import {
  LEARNING_KIND,
  LEARNING_TOPIC,
} from "@liquidation/domain/workspace/constants";
import type {
  LearningEntry,
  LearningKind,
} from "@liquidation/domain/workspace/types";
import { useMemo, useState } from "react";
import { PAGE_VIEW } from "../../../app/constants.ts";
import { learningHref } from "../../../app/page.ts";
import { AnalyticsSelect } from "../../../shared/analytics/filter-fields.tsx";
import { useLocale } from "../../../shared/messages.ts";
import { SelectField } from "../../../shared/ui/select-field.tsx";
import { JOURNAL_STATUS } from "../../journal/data/constants.ts";
import { useJournal } from "../../journal/data/store.ts";
import { JournalUnavailable } from "../../journal/journal-unavailable.tsx";
import { useWorkspaceMessages } from "../messages.ts";
import { LEARNING_DATE_ORDER } from "./constants.ts";
import {
  filterLearningEntries,
  learningNameKey,
  learningNameOptions,
} from "./learning-catalog.ts";
import { LearningDetail } from "./learning-detail.tsx";
import { LearningEditor } from "./learning-editor.tsx";
import { LearningTags } from "./learning-tags.tsx";
import { useLearningMessages } from "./messages.ts";
import type { LearningListFilters, LearningPageProps } from "./types.ts";
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
        groups={
          lecture ? learningNameOptions(records.map(({ group }) => group)) : []
        }
        authors={learningNameOptions(entries.map(({ author }) => author))}
      />
    );
  }
  if (entry) return <LearningDetail entry={entry} />;
  return <LearningList key={kind} kind={kind} records={records} />;
}

function LearningList({
  kind,
  records,
}: {
  kind: LearningKind;
  records: LearningEntry[];
}) {
  const { t, format } = useLocale();
  const m = useWorkspaceMessages();
  const l = useLearningMessages();
  const [filters, setFilters] = useState<LearningListFilters>({
    search: "",
    sort: LEARNING_DATE_ORDER.NEWEST,
  });
  const lecture = kind === LEARNING_KIND.LESSON;
  const visible = filterLearningEntries(records, filters, l.topics);
  const authors = learningNameOptions(records.map(({ author }) => author));
  const topics = Object.values(LEARNING_TOPIC).map((key) => ({
    key,
    label: l.topics[key],
  }));
  const groups = Map.groupBy(visible, (entry) => learningNameKey(entry.group));

  function renderLectures(items: LearningEntry[]) {
    return (
      <ul className="lecture-group-list">
        {items.map((entry) => (
          <li key={entry.id}>
            <div className="learning-row-title">
              <a className="record-link" href={learningHref(kind, entry.id)}>
                {entry.title}
              </a>
              <LearningTags entry={entry} />
            </div>
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
            value={filters.search}
            onChange={(event) =>
              setFilters({ ...filters, search: event.target.value })
            }
          />
        </label>
        <AnalyticsSelect
          label={l.topic}
          all={l.allTopics}
          value={filters.topic}
          options={topics}
          onChange={(topic) => setFilters({ ...filters, topic })}
        />
        <AnalyticsSelect
          label={l.author}
          all={l.allAuthors}
          value={filters.author}
          options={authors}
          onChange={(author) => setFilters({ ...filters, author })}
        />
        <SelectField
          label={l.sortByDate}
          value={filters.sort}
          onChange={(event) =>
            setFilters({
              ...filters,
              sort:
                event.target.value === LEARNING_DATE_ORDER.OLDEST
                  ? LEARNING_DATE_ORDER.OLDEST
                  : LEARNING_DATE_ORDER.NEWEST,
            })
          }
        >
          <option value={LEARNING_DATE_ORDER.NEWEST}>{l.newest}</option>
          <option value={LEARNING_DATE_ORDER.OLDEST}>{l.oldest}</option>
        </SelectField>
        {(filters.search || filters.topic || filters.author) && (
          <button
            type="button"
            className="secondary"
            onClick={() => setFilters({ search: "", sort: filters.sort })}
          >
            {t.resetFilters}
          </button>
        )}
      </div>
      {visible.length === 0 ? (
        <p>{m.noEntries}</p>
      ) : lecture ? (
        <div className="lecture-groups">
          {[...groups].map(([key, items]) => (
            <details key={key} className="panel lecture-group" open>
              <summary>
                <span>{items[0].group ?? l.ungrouped}</span>
                <small>{format.integer.format(items.length)}</small>
              </summary>
              {renderLectures(items)}
            </details>
          ))}
        </div>
      ) : (
        <div className="record-card-grid note-card-grid">
          {visible.map((entry) => (
            <article key={entry.id} className="panel learning-entry">
              <div className="panel-heading">
                <h2>
                  <a
                    className="record-link"
                    href={learningHref(kind, entry.id)}
                    title={entry.title}
                  >
                    {entry.title}
                  </a>
                </h2>
                <time className="note-card-date" dateTime={entry.updatedAt}>
                  {format.date.format(Date.parse(entry.updatedAt))}
                </time>
              </div>
              <LearningTags entry={entry} />
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
