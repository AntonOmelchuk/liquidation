import { PLAN_ACTION } from "@liquidation/domain/plans/constants";
import { planExecution } from "@liquidation/domain/plans/plan-execution";
import { getPlanVoiding } from "@liquidation/domain/plans/plan-lifecycle";
import { useEffect, useRef, useState } from "react";
import { PAGE_HASHES, PAGE_VIEW } from "../../../app/constants.ts";
import { planHref } from "../../../app/page.ts";
import { ScreenshotGallery } from "../../../shared/screenshots/screenshot-gallery.tsx";
import { InstrumentIcons } from "../../../shared/ui/instrument-picker.tsx";
import { Panel } from "../../../shared/ui/layout.tsx";
import { useJournal } from "../../journal/data/store.ts";
import { usePlaybookMessages } from "../../playbooks/messages.ts";
import { PlanPlaybookLink } from "../editor/plan-playbook.tsx";
import {
  PlanAnalysis,
  PlanSetupDetails,
} from "../editor/plan-setup-fields.tsx";
import { usePlanMessages } from "../messages.ts";
import { PlanUnavailable } from "../plan-unavailable.tsx";
import { ActivityForm, PlanActivity } from "./plan-activity.tsx";
import { PlanNarrativeLabel, PlanSpan, PlanStatusChip } from "./plan-facts.tsx";
import { PlanLinkedTrades } from "./plan-linked-trades.tsx";

export function PlanDetailsPage({ id }: { id: string }) {
  const p = usePlanMessages();
  const b = usePlaybookMessages();
  const plan = useJournal((state) =>
    state.plans.find((item) => item.id === id),
  );
  const allTrades = useJournal((state) => state.trades);
  const allPositions = useJournal((state) => state.positions);
  const [action, setAction] = useState<
    typeof PLAN_ACTION.VOID | typeof PLAN_ACTION.RESTORE | null
  >(null);
  const heading = useRef<HTMLHeadingElement>(null);

  const loaded = Boolean(plan);
  useEffect(() => {
    if (loaded && heading.current) {
      window.scrollTo(0, 0);
      heading.current.focus({ preventScroll: true });
    }
  }, [id, loaded]);

  if (!plan) return <PlanUnavailable />;

  const trades = (allTrades ?? []).filter(({ planId }) => planId === id);
  const positions = allPositions.filter(({ planId }) => planId === id);
  const { setup, originalSetup, recap } = plan;
  const voiding = getPlanVoiding(plan);

  return (
    <main className="plan-detail-page">
      <a className="plan-back" href={PAGE_HASHES.plans}>
        ← {p.back}
      </a>
      <div className="page-heading plan-detail-heading">
        <div>
          <h1 ref={heading} tabIndex={-1}>
            {setup.title}
          </h1>
          <div className="plan-detail-meta">
            <span className="instrument-label">
              <InstrumentIcons symbol={setup.symbol} />
              {setup.symbol}
            </span>
            <PlanNarrativeLabel setup={setup} />
            <PlanSpan setup={setup} />
            {setup.playbook && (
              <span>
                {b.link} · <PlanPlaybookLink reference={setup.playbook} />
              </span>
            )}
          </div>
        </div>
        <div className="plan-actions">
          <button
            type="button"
            className="secondary"
            disabled={action !== null}
            onClick={() =>
              setAction(voiding ? PLAN_ACTION.RESTORE : PLAN_ACTION.VOID)
            }
          >
            {voiding ? p.restorePlan : p.voidPlan}
          </button>
          <a className="action-link" href={planHref(id, PLAN_ACTION.EDIT)}>
            {p.edit}
          </a>
        </div>
      </div>
      <div className="layout">
        {action && (
          <Panel title={p.overview}>
            <ActivityForm
              plan={plan}
              activity={action}
              finish={() => setAction(null)}
            />
          </Panel>
        )}
        {Boolean(setup.analysis?.length) && (
          <Panel title={p.analysis}>
            <PlanAnalysis blocks={setup.analysis} />
          </Panel>
        )}
        <Panel title={p.execution} detail={<PlanStatusChip plan={plan} />}>
          <PlanSetupDetails setup={setup} analysis={false} />
          {originalSetup && (
            <details className="plan-original">
              <summary>{p.original}</summary>
              <PlanSetupDetails setup={originalSetup} />
            </details>
          )}
        </Panel>
        <PlanActivity plan={plan} />
        <Panel
          title={p.recap}
          detail={
            <a
              className="action-link secondary"
              href={planHref(id, PAGE_VIEW.REVIEW)}
            >
              {recap ? p.editReview : p.addReview}
            </a>
          }
        >
          {recap ? (
            <>
              {recap.text && <p className="plan-prose">{recap.text}</p>}
              <ScreenshotGallery ids={recap.screenshotIds} />
            </>
          ) : (
            <p>{p.noRecap}</p>
          )}
        </Panel>
        <PlanLinkedTrades
          planId={id}
          data={planExecution(plan, trades, positions)}
          trades={trades}
          positions={positions}
        />
      </div>
    </main>
  );
}
