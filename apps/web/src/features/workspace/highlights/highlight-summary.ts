import { priceMetrics } from "@liquidation/domain/analytics/trade-risk";
import { instrumentMarket } from "@liquidation/domain/instruments/instruments";
import {
  currentVersion,
  linkedVersion,
} from "@liquidation/domain/playbooks/playbook";
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
  const version = book && link ? linkedVersion(book, link) : undefined;
  const versionNumber =
    link?.version ?? (book ? currentVersion(book).number : undefined);
  const planned = trade ? priceMetrics(trade).plannedRR : null;
  return {
    date: stored?.date ?? (trade ? localDay(trade.openedAt) : undefined),
    market:
      stored?.market ??
      instrumentMarket(trade?.symbol ?? entry?.example?.symbol ?? ""),
    style: stored?.style ?? trade?.style,
    timeframe: stored?.timeframe ?? trade?.timeframe,
    model:
      stored?.model ??
      version?.setups.find(({ id }) => id === link?.setupId)?.name,
    playbook:
      stored?.playbook ??
      (link && versionNumber
        ? { id: link.id, version: versionNumber }
        : undefined),
    rr:
      stored?.rr ??
      (planned !== null && Number.isFinite(planned) && planned >= 0
        ? planned
        : undefined),
    type: stored?.type,
  };
}
