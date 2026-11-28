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

import { EMPTY_VALUE } from "../../../shared/constants.ts";
import { DateText } from "../../../shared/ui/date-text.tsx";
import { useLocale } from "../../../shared/messages.ts";
import { DirectionBadge } from "../../../shared/ui/direction-badge.tsx";
import { usePlanMessages } from "../messages.ts";
import "./plan-status.css";

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
      {!compact && "outcome" in review && (
        <small className="plan-status-detail">
          {review.outcome
            ? `${format.money.format(review.outcome.netR)} R`
            : p.pendingMiss}
        </small>
      )}
    </div>
  );
}

export function PlanSpan({ setup, compact = false }: PlanSpanProps) {
  const p = usePlanMessages();
  const { startsOn, endsOn } = setup;
  if (!startsOn) {
    return compact ? (
      <span title={p.noPeriod}>{EMPTY_VALUE}</span>
    ) : (
      <span>{p.noPeriod}</span>
    );
  }

  return (
    <span className="plan-dates">
      <DateText value={startsOn} />
      {endsOn && endsOn !== startsOn && (
        <>
          {" "}
          – <DateText value={endsOn} />
        </>
      )}
    </span>
  );
}

export function PlanNarrativeLabel({ setup }: PlanNarrativeLabelProps) {
  const p = usePlanMessages();
  const narrative = getPlanNarrative(setup);
  return <DirectionBadge direction={narrative}>{p[narrative]}</DirectionBadge>;
}
