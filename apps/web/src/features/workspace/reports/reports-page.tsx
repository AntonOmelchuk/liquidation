import { PERIODS } from "@liquidation/domain/workspace/constants";
import { localDay } from "@liquidation/domain/workspace/period";
import { PAGE_HASHES, RECENT_REVIEW_HREF } from "../../../app/constants.ts";
import { cardsHref, reportHref } from "../../../app/page.ts";
import { useLocale } from "../../../shared/messages.ts";
import { JOURNAL_STATUS } from "../../journal/data/constants.ts";
import { useJournal } from "../../journal/data/store.ts";
import { JournalUnavailable } from "../../journal/journal-unavailable.tsx";
import { useWorkspaceMessages } from "../messages.ts";
import "../workspace.css";
import { PeriodReport } from "./period-report.tsx";
import { RecentReview } from "./recent-review.tsx";
import { ReportsShelf } from "./reports-shelf.tsx";
import { useReportIndexMessages } from "./index-messages.ts";
import type { ReportPageProps } from "./types.ts";

export default function ReportsPage({ period, day, recent }: ReportPageProps) {
  const { t } = useLocale();
  const m = useWorkspaceMessages();
  const c = useReportIndexMessages();
  const trades = useJournal((state) => state.trades);
  const status = useJournal((state) => state.status);
  const today = localDay(new Date().toISOString());

  if (status !== JOURNAL_STATUS.READY || !trades) {
    return (
      <JournalUnavailable
        backHref={PAGE_HASHES.journal}
        backLabel={t.backJournal}
        missing={t.noTrades}
      />
    );
  }

  return (
    <main className="workspace-page">
      <div className="page-heading">
        <h1>{!period && !recent ? m.reportShelf : m.reports}</h1>
      </div>
      <nav className="workspace-tabs" aria-label={m.reports}>
        <a className="action-link secondary" href={cardsHref(day ?? today)}>
          {c.openCards}
        </a>
        <a
          className="action-link secondary"
          href={PAGE_HASHES.reports}
          aria-current={!recent && !period ? "page" : undefined}
        >
          {c.returnToShelf}
        </a>
        {PERIODS.map((kind) => (
          <a
            key={kind}
            className="action-link secondary"
            href={reportHref(kind, today)}
            aria-current={!recent && kind === period ? "page" : undefined}
          >
            {m[kind]}
          </a>
        ))}
        <a
          href={RECENT_REVIEW_HREF}
          className="action-link secondary"
          aria-current={recent ? "page" : undefined}
        >
          {m.recent}
        </a>
        <a href={PAGE_HASHES.review} className="record-link">
          {t.reviewNav} →
        </a>
      </nav>
      {recent ? (
        <RecentReview trades={trades} />
      ) : period ? (
        <PeriodReport key={period + day} period={period} day={day ?? today} />
      ) : (
        <ReportsShelf />
      )}
    </main>
  );
}
