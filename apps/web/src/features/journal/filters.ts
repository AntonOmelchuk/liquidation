import { tradeAccountKey } from "@liquidation/domain/trades/trade-tags";
import type { Trade } from "@liquidation/domain/trades/types";
import { FILTER_ALL } from "../../shared/constants.ts";
import type { TradeFilters } from "./types.ts";

import {
  closingPeriod,
  invalidDateRange,
} from "../../shared/analytics/date-range.ts";

export function filterTrades(trades: readonly Trade[], filters: TradeFilters) {
  const { query, side, from, through, account } = filters;
  if (invalidDateRange(filters)) return [];

  const { start, end } = closingPeriod({ from, through });

  return trades.filter((trade) => {
    const closedAt = Date.parse(trade.closedAt);
    return (
      trade.symbol.includes(query) &&
      (account === undefined || tradeAccountKey(trade) === account) &&
      (side === FILTER_ALL || trade.direction === side) &&
      closedAt >= start &&
      closedAt < end
    );
  });
}
