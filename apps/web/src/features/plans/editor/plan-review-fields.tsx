import {
  PLAN_STATUS,
  PLAN_STATUSES,
} from "@liquidation/domain/plans/constants";
import { isPlanOpportunityStatus } from "@liquidation/domain/plans/plan-lifecycle";
import type { PlanStatus } from "@liquidation/domain/plans/types";
import { useState } from "react";
import type { PlanReviewFieldsProps } from "./types.ts";

import { isoToLocalDateTime } from "../../../shared/format.ts";
import { SelectField } from "../../../shared/ui/select-field.tsx";
import { usePlanMessages } from "../messages.ts";

export function PlanReviewFields({ review }: PlanReviewFieldsProps) {
  const p = usePlanMessages();
  const initialOutcome = "outcome" in review ? review.outcome : null;
  const [status, setStatus] = useState<PlanStatus>(review.status);
  const [reason, setReason] = useState(
    review.status === PLAN_STATUS.FAILED ? review.reason : "",
  );
  const [closedAt, setClosedAt] = useState(
    initialOutcome ? isoToLocalDateTime(initialOutcome.closedAt) : "",
  );
  const [netR, setNetR] = useState(
    initialOutcome ? String(initialOutcome.netR) : "",
  );

  const [risk, setRisk] = useState(initialOutcome?.risk?.toString() ?? "");

  return (
    <>
      <SelectField
        label={p.status}
        name="status"
        value={status}
        onChange={(event) => {
          const next = PLAN_STATUSES.find(
            (option) => option === event.currentTarget.value,
          );
          if (next) setStatus(next);
        }}
      >
        {PLAN_STATUSES.map((option) => (
          <option key={option} value={option}>
            {p[option]}
          </option>
        ))}
      </SelectField>
      {status === PLAN_STATUS.FAILED && (
        <label className="wide">
          {p.reason}
          <textarea
            name="reason"
            required
            rows={3}
            maxLength={4000}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </label>
      )}
      {isPlanOpportunityStatus(status) && (
        <>
          <p className="wide plan-field-hint" id="missed-outcome-hint">
            {p.missedHint}
          </p>
          <label>
            {p.missedDate}
            <input
              name="missedDate"
              type="datetime-local"
              aria-describedby="missed-outcome-hint"
              value={closedAt}
              onChange={(event) => setClosedAt(event.target.value)}
            />
          </label>
          <label>
            {p.missedNetR}
            <input
              name="missedNetR"
              type="number"
              step="any"
              aria-describedby="missed-outcome-hint"
              value={netR}
              onChange={(event) => setNetR(event.target.value)}
            />
          </label>
          <label>
            {p.missedRisk}
            <input
              name="missedRisk"
              type="number"
              step="0.01"
              min="0.01"
              max="1000000000"
              value={risk}
              onChange={(event) => setRisk(event.target.value)}
            />
          </label>
        </>
      )}
    </>
  );
}
