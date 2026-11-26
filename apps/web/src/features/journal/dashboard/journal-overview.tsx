import { isOpenPlan } from "@liquidation/domain/plans/plan-lifecycle";
import { PERIOD } from "@liquidation/domain/workspace/constants";
import { periodBounds } from "@liquidation/domain/workspace/period";
import type { PreparationPeriod } from "@liquidation/domain/workspace/types";
import { useState } from "react";
import { PAGE_HASHES } from "../../../app/constants.ts";
import { planHref } from "../../../app/page.ts";
import { useLocale } from "../../../shared/messages.ts";
import { InstrumentIcons } from "../../../shared/ui/instrument-picker.tsx";
import { Panel } from "../../../shared/ui/layout.tsx";
import { CalendarPanel } from "../../market/calendar-panel.tsx";
import { PlanStatusChip } from "../../plans/details/plan-facts.tsx";
import { useWorkspaceMessages } from "../../workspace/messages.ts";
import { PeriodThoughtsPanel } from "../../workspace/planning/period-thoughts-panel.tsx";
import { WeeklyWatchlistPanel } from "../../workspace/planning/weekly-watchlist-panel.tsx";
import { useJournal } from "../data/store.ts";
import { ReviewPanel } from "./review-panel.tsx";

export function JournalOverview({ today }: { today: string }) {
  const [period, setPeriod] = useState<PreparationPeriod>(PERIOD.DAY);
  const { t } = useLocale();
  const m = useWorkspaceMessages();
  const { start, through } = periodBounds(period, today);
  const plans = useJournal((state) => state.plans);
  const active = plans.filter((plan) => {
    const first = plan.setup.startsOn;
    const last = plan.setup.endsOn ?? first;
    return (
      isOpenPlan(plan) &&
      (!first || first <= through) &&
      (!last || last >= start)
    );
  });
  return (
    <div className="dashboard-split">
      <div className="layout">
        <PeriodThoughtsPanel
          key={period + ":" + start}
          day={today}
          period={period}
          onPeriodChange={setPeriod}
        />
        <ReviewPanel today={today} />
        <CalendarPanel />
      </div>
      <div className="layout">
        <WeeklyWatchlistPanel today={today} />
        <Panel title={m.activePlans} detail={active.length}>
          {active.length ? (
            <ul className="dashboard-plan-list">
              {active.slice(0, 8).map((plan) => (
                <li key={plan.id}>
                  <div className="dashboard-plan-heading">
                    <div className="dashboard-plan-identity">
                      <a className="record-link" href={planHref(plan.id)}>
                        {plan.setup.title}
                      </a>
                      <span className="instrument-label">
                        <InstrumentIcons symbol={plan.setup.symbol} />
                        {plan.setup.symbol}
                      </span>
                    </div>
                    <PlanStatusChip plan={plan} compact />
                  </div>
                  {plan.setup.entryCondition && (
                    <p className="record-prose">{plan.setup.entryCondition}</p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>{m.noActivePlans}</p>
          )}
          <a className="record-link" href={PAGE_HASHES.plans}>
            {t.plansNav} →
          </a>
        </Panel>
      </div>
    </div>
  );
}
