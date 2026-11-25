import { PLAYBOOK_STATUS } from "@liquidation/domain/playbooks/constants";
import { currentVersion } from "@liquidation/domain/playbooks/playbook";
import { getPlaybookTemplate } from "@liquidation/domain/playbooks/strategy";
import {
  playbookResults,
  playbookReviewProgress,
} from "@liquidation/domain/playbooks/playbook-performance";
import { useState } from "react";
import { NEW_PLAYBOOK_HREF, PAGE_HASHES } from "../../app/constants.ts";
import { playbookHref } from "../../app/page.ts";
import { EMPTY_VALUE, FILTER_ALL } from "../../shared/constants.ts";
import { numericTone } from "../../shared/format.ts";
import { useLocale } from "../../shared/messages.ts";
import { Panel } from "../../shared/ui/layout.tsx";
import { SelectField } from "../../shared/ui/select-field.tsx";
import { JOURNAL_STATUS } from "../journal/data/constants.ts";
import { useJournal } from "../journal/data/store.ts";
import { JournalUnavailable } from "../journal/journal-unavailable.tsx";
import { usePlaybookMessages } from "./messages.ts";
import { useStrategyMessages } from "./strategy/messages.ts";
import "./playbooks.css";

export function PlaybooksPage() {
  const { t, format } = useLocale();
  const b = usePlaybookMessages();
  const s = useStrategyMessages();
  const status = useJournal((state) => state.status);
  const playbooks = useJournal((state) => state.playbooks);
  const trades = useJournal((state) => state.trades);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(FILTER_ALL);
  const books = playbooks
    .filter(
      (book) =>
        (filter === FILTER_ALL || book.status === filter) &&
        (book.title + " " + book.overview)
          .toLocaleLowerCase()
          .includes(search.trim().toLocaleLowerCase()),
    )
    .toSorted(
      (a, b) =>
        Number(a.status === PLAYBOOK_STATUS.RETIRED) -
          Number(b.status === PLAYBOOK_STATUS.RETIRED) ||
        Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
    );

  if (status !== JOURNAL_STATUS.READY)
    return (
      <JournalUnavailable
        backHref={PAGE_HASHES.journal}
        backLabel={t.backJournal}
        missing={b.missing}
      />
    );
  return (
    <main>
      <header className="page-heading">
        <h1>{b.title}</h1>
        <a className="action-link" href={NEW_PLAYBOOK_HREF}>
          ＋ {b.new}
        </a>
      </header>
      <Panel title={b.title} detail={books.length}>
        <div className="journal-filters">
          <label>
            {b.search}
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <SelectField
            label={b.status}
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value={FILTER_ALL}>{b.allStatuses}</option>
            {Object.values(PLAYBOOK_STATUS).map((value) => (
              <option key={value} value={value}>
                {b[value]}
              </option>
            ))}
          </SelectField>
        </div>
        {books.length === 0 ? (
          <p>{playbooks.length ? t.noMatches : b.noBooks}</p>
        ) : (
          <div className="table compact-record-table playbooks-table">
            <table aria-label={b.title}>
              <thead>
                <tr>
                  <th>{b.title}</th>
                  <th>{s.template}</th>
                  <th>{b.status}</th>
                  <th>{b.version}</th>
                  <th>{t.count}</th>
                  <th>WR</th>
                  <th>{t.pnl}</th>
                  <th>Σ R</th>
                  <th>{b.reviewDue}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {books.map((book) => {
                  const version = currentVersion(book);
                  const results = playbookResults(
                    (trades ?? []).filter(
                      ({ playbook }) => playbook?.id === book.id,
                    ),
                  );
                  const review = playbookReviewProgress(book, results.count);
                  return (
                    <tr key={book.id}>
                      <th scope="row">
                        <a className="record-link" href={playbookHref(book.id)}>
                          {book.title}
                        </a>
                        {book.overview && (
                          <small
                            className="playbook-list-overview"
                            title={book.overview}
                          >
                            {book.overview}
                          </small>
                        )}
                      </th>
                      <td>{s[getPlaybookTemplate(version.strategy)]}</td>
                      <td>
                        <span
                          className="playbook-status"
                          data-status={book.status}
                        >
                          {b[book.status]}
                        </span>
                      </td>
                      <td>v{format.integer.format(version.number)}</td>
                      <td>{format.integer.format(results.count)}</td>
                      <td>
                        {results.winRate === null
                          ? EMPTY_VALUE
                          : format.percentage.format(results.winRate)}
                      </td>
                      <td className={numericTone(results.net)}>
                        {format.money.format(results.net)}
                      </td>
                      <td>
                        {results.totalR === null
                          ? EMPTY_VALUE
                          : format.money.format(results.totalR)}
                      </td>
                      <td>
                        {review ? (
                          <span
                            className={
                              review.due > 0 ? "review-due" : undefined
                            }
                          >
                            {review.due > 0 ? review.due + " · " : ""}
                            {review.progress}/{review.size}
                          </span>
                        ) : (
                          EMPTY_VALUE
                        )}
                      </td>
                      <td>
                        <a
                          className="record-link"
                          href={playbookHref(book.id, true)}
                        >
                          {b.edit}
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </main>
  );
}
