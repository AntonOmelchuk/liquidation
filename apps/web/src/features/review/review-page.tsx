import { useMemo, useState } from "react";
import { recentReviewDates } from "@liquidation/domain/review/calendar";
import {
  REVIEW_DAYS,
  REVIEW_PERIOD,
} from "@liquidation/domain/review/constants";
import { buildReview } from "@liquidation/domain/review/report";
import type { ReviewPeriod } from "@liquidation/domain/review/types";
import { useAccountOptions } from "../accounts/account-options.ts";
import { PAGE_HASHES } from "../../app/constants.ts";
import { invalidDateRange } from "../../shared/analytics/date-range.ts";
import { FactorButtons } from "../../shared/analytics/factor-buttons.tsx";
import {
  AnalyticsSelect,
  DateRangeFields,
} from "../../shared/analytics/filter-fields.tsx";
import { useLocale } from "../../shared/messages.ts";
import { Panel } from "../../shared/ui/layout.tsx";
import { JOURNAL_STATUS } from "../journal/data/constants.ts";
import { useJournal } from "../journal/data/store.ts";
import { JournalUnavailable } from "../journal/journal-unavailable.tsx";
import { useReviewMessages } from "./messages.ts";
import { ReviewWorkspace } from "./review-workspace.tsx";
import "./review.css";

export default function ReviewPage() {
  const { t } = useLocale();
  const m = useReviewMessages();
  const { trades, positions, status } = useJournal();
  const [timeZone] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const [period, setPeriod] = useState<ReviewPeriod>(REVIEW_PERIOD.WEEK);
  const [dates, setDates] = useState(() =>
    recentReviewDates(timeZone, REVIEW_DAYS[REVIEW_PERIOD.WEEK]),
  );
  const [account, setAccount] = useState<string>();
  const accounts = useAccountOptions();
  const missing = !dates.from || !dates.through;
  const invalid = invalidDateRange(dates);
  const report = useMemo(
    () =>
      missing || invalid || !trades
        ? null
        : buildReview({ trades, positions }, { ...dates, timeZone, account }),
    [account, dates, invalid, missing, positions, timeZone, trades],
  );

  if (status !== JOURNAL_STATUS.READY) {
    return (
      <JournalUnavailable
        backHref={PAGE_HASHES.journal}
        backLabel={t.backJournal}
        missing={m.empty}
      />
    );
  }

  return (
    <main className="review-page">
      <header className="page-heading">
        <h1>{m.title}</h1>
      </header>
      <div className="layout">
        <Panel title={m.dateScope} detail={timeZone}>
          <FactorButtons
            label={m.dateScope}
            value={period}
            options={Object.values(REVIEW_PERIOD).map((key) => ({
              key,
              label: m.periods[key],
            }))}
            onChange={(next) => {
              setPeriod(next);
              if (next !== REVIEW_PERIOD.CUSTOM)
                setDates(recentReviewDates(timeZone, REVIEW_DAYS[next]));
            }}
          />
          <div className="review-dates">
            <DateRangeFields
              range={dates}
              fromLabel={t.fromDate}
              throughLabel={t.toDate}
              invalid={invalid}
              onChange={(next) => {
                setPeriod(REVIEW_PERIOD.CUSTOM);
                setDates(next);
              }}
            />
            {accounts.length > 0 && (
              <AnalyticsSelect
                label={m.account}
                all={m.allAccounts}
                value={account}
                options={accounts}
                onChange={setAccount}
              />
            )}
          </div>
          {missing && <p role="status">{m.missingDates}</p>}
          {invalid && (
            <p role="alert" className="error">
              {t.invalidDateRange}
            </p>
          )}
        </Panel>
        {report &&
          (report.records.length > 0 ? (
            <ReviewWorkspace
              key={JSON.stringify([dates.from, dates.through, account])}
              report={report}
            />
          ) : (
            <Panel title={m.overview}>
              <p role="status">{m.empty}</p>
              <p>
                {m.open} · {report.openPositions}
              </p>
            </Panel>
          ))}
      </div>
    </main>
  );
}
