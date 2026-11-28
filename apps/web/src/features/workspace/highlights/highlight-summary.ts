import { priceMetrics } from "@liquidation/domain/analytics/trade-risk";
import { instrumentMarket } from "@liquidation/domain/instruments/instruments";
import { tradePlaybookRules } from "@liquidation/domain/playbooks/playbook";
import type { Playbook } from "@liquidation/domain/playbooks/types";
import type { Trade } from "@liquidation/domain/trades/types";
import { localDay } from "@liquidation/domain/workspace/period";
import type {
  Highlight,
  HighlightDetails,
} from "@liquidation/domain/workspace/types";

export function highlightSummary(
  entry?: Highlight,
  trade?: Trade,
  book?: Playbook,
): HighlightDetails {
  const stored = entry?.details;
  const link = trade?.playbook;
  const rules = link ? tradePlaybookRules(book, link) : undefined;
  const planned = trade ? priceMetrics(trade).plannedRR : null;
  return {
    date: stored?.date ?? (trade ? localDay(trade.openedAt) : undefined),
    market:
      stored?.market ??
      instrumentMarket(trade?.symbol ?? entry?.example?.symbol ?? ""),
    style: stored?.style ?? trade?.style,
    timeframe: stored?.timeframe ?? trade?.timeframe,
    model: stored?.model ?? rules?.setupName,
    playbook: stored?.playbook ?? (link ? { id: link.id } : undefined),
    rr:
      stored?.rr ??
      (planned !== null && Number.isFinite(planned) && planned >= 0
        ? planned
        : undefined),
    type: stored?.type,
  };
}
