import { useState } from "react";
import { REVIEW_GROUP } from "@liquidation/domain/review/constants";
import type { ReviewGroup } from "@liquidation/domain/review/types";
import { FactorButtons } from "../../../shared/analytics/factor-buttons.tsx";
import { useLocale } from "../../../shared/messages.ts";
import { Metric, Panel } from "../../../shared/ui/layout.tsx";
import { useReviewMessages } from "../messages.ts";
import type { ReviewOverviewProps } from "../types.ts";
import { ReviewDataTable } from "./data-table.tsx";
import { reviewValues } from "./presentation.ts";

export function ReviewOverview({ report, tables }: ReviewOverviewProps) {
  const locale = useLocale();
  const m = useReviewMessages();
  const { t } = locale;
  const { totals } = report;
  const { amount, percent, count } = reviewValues({ ...locale, messages: m });
  const [group, setGroup] = useState<ReviewGroup>(REVIEW_GROUP.SYMBOLS);

  return (
    <>
      <section aria-label={m.overview}>
        <div className="metrics review-kpis">
          <Metric
            label={t.pnl}
            value={amount(totals.net)}
            detail={`${t.count} · ${count(totals.count)}`}
          />
          <Metric label={t.win} value={percent(totals.winRate)} />
          <Metric label={t.profitFactor} value={amount(totals.profitFactor)} />
        </div>
        <p className="review-note">
          {m.open} · {count(report.openPositions)}
        </p>
      </section>
      <div className="review-report-grid">
        <Panel title={m.metrics}>
          <ReviewDataTable {...tables.metrics} />
          <p className="review-note">{m.drawdownHint}</p>
          <p className="review-note">{m.breakEvenHint}</p>
        </Panel>
        <div className="review-breakdowns">
          <Panel title={m.byAccount}>
            <ReviewDataTable {...tables.accounts} />
          </Panel>
          <Panel title={m.dimensions}>
            <FactorButtons
              label={m.dimensions}
              value={group}
              options={Object.values(REVIEW_GROUP).map((key) => ({
                key,
                label: m.groups[key],
              }))}
              onChange={setGroup}
            />
            <ReviewDataTable {...tables.groups[group]} />
            <p className="review-note">{m.smallHint}</p>
          </Panel>
        </div>
      </div>
    </>
  );
}
