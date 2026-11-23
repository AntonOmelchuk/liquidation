import { PLAN_STATUS } from "@liquidation/domain/plans/constants";
import {
  getPlanNarrative,
  getPlanVoiding,
} from "@liquidation/domain/plans/plan-lifecycle";
import type {
  PlanNarrativeLabelProps,
  PlanSpanProps,
  PlanStatusChipProps,
} from "./types.ts";

import { useLocale } from "../../../shared/messages.ts";
import { usePlanMessages } from "../messages.ts";

export function PlanStatusChip({ plan, compact = false }: PlanStatusChipProps) {
  const { format } = useLocale();
  const p = usePlanMessages();
  const { review } = plan;
  const voiding = getPlanVoiding(plan);
  return (
    <div className="plan-state">
      <span className="plan-status" data-status={review.status}>
        {p[review.status]}
      </span>
      {voiding && (
        <span className="plan-status" data-status={PLAN_STATUS.FAILED}>
          {p.voided}
        </span>
      )}
      {!compact && review.status === PLAN_STATUS.FAILED && (
        <small className="plan-status-detail">{review.reason}</small>
      )}
      {!compact && review.status === PLAN_STATUS.MISSED && (
        <small className="plan-status-detail">
          {review.outcome
            ? `${format.money.format(review.outcome.netR)} R`
            : p.pendingMiss}
        </small>
      )}
    </div>
  );
}

export function PlanSpan({ setup }: PlanSpanProps) {
  const { format } = useLocale();
  const p = usePlanMessages();
  const { startsOn, endsOn } = setup;
  if (!startsOn) return <span>{p.noPeriod}</span>;

  return (
    <span className="plan-dates">
      <time dateTime={startsOn}>{format.day.format(Date.parse(startsOn))}</time>
      {endsOn && endsOn !== startsOn && (
        <>
          {" "}
          –{" "}
          <time dateTime={endsOn}>{format.day.format(Date.parse(endsOn))}</time>
        </>
      )}
    </span>
  );
}

export function PlanNarrativeLabel({ setup }: PlanNarrativeLabelProps) {
  const p = usePlanMessages();
  return <span>{p[getPlanNarrative(setup)]}</span>;
}
