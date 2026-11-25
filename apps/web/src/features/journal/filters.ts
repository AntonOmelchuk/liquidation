import { tradeAccountKey } from "@liquidation/domain/trades/trade-tags";
import type { Position, Trade } from "@liquidation/domain/trades/types";
import { FILTER_ALL } from "../../shared/constants.ts";
import type { TradeFilters } from "./types.ts";

import {
  closingPeriod,
  invalidDateRange,
} from "../../shared/analytics/date-range.ts";

export function filterJournalRecords<T extends Trade | Position>(
  records: readonly T[],
  filters: TradeFilters,
) {
  const { query, side, from, through, account } = filters;
  if (invalidDateRange(filters)) return [];

  const { start, end } = closingPeriod({ from, through });

  return records.filter((trade) => {
    const date = Date.parse(
      "closedAt" in trade ? trade.closedAt : trade.openedAt,
    );
    return (
      trade.symbol.includes(query) &&
      (account === undefined || tradeAccountKey(trade) === account) &&
      (side === FILTER_ALL || trade.direction === side) &&
      date >= start &&
      date < end
    );
  });
}
