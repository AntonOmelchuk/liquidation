import type { HighlightDetails } from "@liquidation/domain/workspace/types";
import { EMPTY_VALUE } from "../../../shared/constants.ts";
import { formatCompactDay } from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import { PlanPlaybookLink } from "../../plans/editor/plan-playbook.tsx";
import { useHighlightMessages } from "./messages.ts";

export function useHighlightValues(details: HighlightDetails) {
  const { format } = useLocale();
  const h = useHighlightMessages();
  return {
    date: details.date ? (
      <time dateTime={details.date}>{formatCompactDay(details.date)}</time>
    ) : (
      EMPTY_VALUE
    ),
    market: details.market ? (
      <span className="highlight-tag" data-value={details.market}>
        {h.markets[details.market]}
      </span>
    ) : (
      EMPTY_VALUE
    ),
    style: details.style ?? EMPTY_VALUE,
    timeframe: details.timeframe ? (
      <span className="highlight-tag">{details.timeframe}</span>
    ) : (
      EMPTY_VALUE
    ),
    model: details.model ?? EMPTY_VALUE,
    playbook: <PlanPlaybookLink reference={details.playbook} />,
    rr:
      details.rr === undefined ? (
        EMPTY_VALUE
      ) : (
        <span title={h.plannedRR}>{format.money.format(details.rr)}</span>
      ),
    type: details.type ? (
      <span className="highlight-tag" data-value={details.type}>
        {h.types[details.type]}
      </span>
    ) : (
      EMPTY_VALUE
    ),
  };
}
