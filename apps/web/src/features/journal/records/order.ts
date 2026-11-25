import type { TradeRecord } from "./types.ts";

export function newestTradeRecord(first: TradeRecord, second: TradeRecord) {
  const firstAt = "closedAt" in first ? first.closedAt : first.openedAt;
  const secondAt = "closedAt" in second ? second.closedAt : second.openedAt;
  return (
    Date.parse(secondAt) - Date.parse(firstAt) ||
    first.id.localeCompare(second.id)
  );
}
