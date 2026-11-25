import { useEffect, useRef, useState } from "react";
import { REVIEW_MODEL_STATUS } from "@liquidation/domain/review/constants";
import { reviewEvidenceSignature } from "@liquidation/domain/review/evidence";
import type {
  ReviewModelResult,
  ReviewReport,
} from "@liquidation/domain/review/types";
import { requestReview } from "./api.ts";

export function useReviewModel(report: ReviewReport) {
  const [result, setResult] = useState<ReviewModelResult>();
  const [running, setRunning] = useState(false);
  const pending = useRef<AbortController | null>(null);

  useEffect(() => () => pending.current?.abort(), []);

  async function generate() {
    if (pending.current) return;
    const controller = new AbortController();
    pending.current = controller;
    setRunning(true);
    setResult(undefined);

    const response = await requestReview(report.query, controller.signal);
    pending.current = null;
    if (controller.signal.aborted) return;
    setRunning(false);
    setResult(response);
  }

  const ready = result?.status === REVIEW_MODEL_STATUS.READY;
  const stale = ready && result.signature !== reviewEvidenceSignature(report);
  return {
    generate,
    running,
    stale,
    error: ready ? undefined : result?.status,
    insights: ready && !stale ? result.insights : [],
  };
}
