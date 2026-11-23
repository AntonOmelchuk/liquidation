import { PLAYBOOK_STATUS } from "@liquidation/domain/playbooks/constants";
import { currentVersion } from "@liquidation/domain/playbooks/playbook";
import {
  playbookResults,
  playbookReviewProgress,
} from "@liquidation/domain/playbooks/playbook-performance";
import { NEW_PLAYBOOK_HREF, PAGE_HASHES } from "../../app/constants.ts";
import { playbookHref } from "../../app/page.ts";
import { EMPTY_VALUE } from "../../shared/constants.ts";
import { useLocale } from "../../shared/messages.ts";
import { JOURNAL_STATUS } from "../journal/data/constants.ts";
import { useJournal } from "../journal/data/store.ts";
import { JournalUnavailable } from "../journal/journal-unavailable.tsx";
import { usePlaybookMessages } from "./messages.ts";
import "./playbooks.css";

export function PlaybooksPage() {
  const { t, format } = useLocale();
  const b = usePlaybookMessages();
  const status = useJournal((state) => state.status);
  const playbooks = useJournal((state) => state.playbooks);
  const trades = useJournal((state) => state.trades);
  const books = playbooks.toSorted((a, b) => {
    return (
      Number(a.status === PLAYBOOK_STATUS.RETIRED) -
        Number(b.status === PLAYBOOK_STATUS.RETIRED) ||
      Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
    );
  });

  if (status !== JOURNAL_STATUS.READY) {
    return (
      <JournalUnavailable
        backHref={PAGE_HASHES.journal}
        backLabel={t.backJournal}
        missing={b.missing}
      />
    );
  }

  return (
    <main>
      <header className="page-heading">
        <h1>{b.title}</h1>
        <a className="action-link" href={NEW_PLAYBOOK_HREF}>
          ＋ {b.new}
        </a>
      </header>
      {books.length === 0 ? (
        <p>{b.noBooks}</p>
      ) : (
        <div className="record-card-grid">
          {books.map((book) => {
            const results = playbookResults(
              (trades ?? []).filter(({ playbook }) => playbook?.id === book.id),
            );
            const review = playbookReviewProgress(book, results.count);
            return (
              <article className="panel playbook-card" key={book.id}>
                <div className="panel-heading">
                  <h2>
                    <a className="record-link" href={playbookHref(book.id)}>
                      {book.title}
                    </a>
                  </h2>
                  <span className="playbook-status" data-status={book.status}>
                    {b[book.status]}
                  </span>
                </div>
                <span className="subdued">
                  v{format.integer.format(currentVersion(book).number)}
                </span>
                {book.overview && (
                  <p className="record-prose">{book.overview}</p>
                )}
                <dl className="playbook-facts">
                  <div>
                    <dt>{t.count}</dt>
                    <dd>{format.integer.format(results.count)}</dd>
                  </div>
                  <div>
                    <dt>{t.win}</dt>
                    <dd>
                      {results.winRate === null
                        ? EMPTY_VALUE
                        : format.percentage.format(results.winRate)}
                    </dd>
                  </div>
                  <div>
                    <dt>{t.result}</dt>
                    <dd>
                      {results.totalR === null
                        ? EMPTY_VALUE
                        : `${format.money.format(results.totalR)} R`}
                    </dd>
                  </div>
                </dl>
                {review && review.due > 0 && (
                  <p className="review-due">
                    {b.reviewDue} · {format.integer.format(review.due)}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
