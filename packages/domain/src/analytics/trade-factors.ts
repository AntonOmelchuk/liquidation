import { tradeTagKey } from "../trades/trade-tags.ts";
import { netCents } from "../trades/trade.ts";
import type { Trade } from "../trades/types.ts";
import {
  HOLD_TIME,
  HOURS_IN_MS,
  TRADE_FACTOR,
  TRADE_OUTCOME,
} from "./constants.ts";
import { tradeStatistics } from "./trade-statistics.ts";
import type { TimeWindow, TradeFactor, TradeFactorFilters } from "./types.ts";

function holdingBucket(trade: Trade) {
  const hours =
    (Date.parse(trade.closedAt) - Date.parse(trade.openedAt)) / HOURS_IN_MS;
  if (hours < 4) return HOLD_TIME.UNDER_4H;
  if (hours < 12) return HOLD_TIME.FROM_4_TO_12H;
  if (hours < 24) return HOLD_TIME.FROM_12_TO_24H;
  return hours <= 72 ? HOLD_TIME.FROM_24_TO_72H : HOLD_TIME.OVER_72H;
}

export function playbookVersionKey(id: string, version?: number) {
  return version === undefined ? id : `${id}:${version}`;
}

export function tradeFactorKeys(trade: Trade, factor: TradeFactor): string[] {
  switch (factor) {
    case TRADE_FACTOR.INSTRUMENT:
      return [trade.symbol];
    case TRADE_FACTOR.TIMEFRAME:
      return [trade.timeframe?.toUpperCase() ?? ""];
    case TRADE_FACTOR.PLAYBOOK:
      return [trade.playbook?.id ?? ""];
    case TRADE_FACTOR.VERSION:
      return [
        trade.playbook
          ? playbookVersionKey(trade.playbook.id, trade.playbook.version)
          : "",
      ];
    case TRADE_FACTOR.SETUP: {
      const link = trade.playbook;
      return [
        link?.setupId && link.version !== undefined
          ? playbookVersionKey(link.id, link.version) + ":" + link.setupId
          : "",
      ];
    }
    case TRADE_FACTOR.SIDE:
      return [trade.direction];
    case TRADE_FACTOR.WEEKDAY:
      return [String(new Date(trade.openedAt).getDay() || 7)];
    case TRADE_FACTOR.HOUR:
      return [String(new Date(trade.openedAt).getHours()).padStart(2, "0")];
    case TRADE_FACTOR.MONTH: {
      const date = new Date(trade.closedAt);
      return [
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      ];
    }
    case TRADE_FACTOR.YEAR:
      return [String(new Date(trade.closedAt).getFullYear())];
    case TRADE_FACTOR.DURATION:
      return [holdingBucket(trade)];
    case TRADE_FACTOR.OUTCOME: {
      const net = netCents(trade);
      return [
        net > 0
          ? TRADE_OUTCOME.WIN
          : net < 0
            ? TRADE_OUTCOME.LOSS
            : TRADE_OUTCOME.FLAT,
      ];
    }
    case TRADE_FACTOR.ACCOUNT:
      return [trade.account ? tradeTagKey(trade.account) : ""];
    case TRADE_FACTOR.SESSION:
      return [trade.session ?? ""];
    case TRADE_FACTOR.ENTRY_TYPE:
      return [trade.entryType ?? ""];
    case TRADE_FACTOR.MISTAKE:
      return trade.mistakes?.length
        ? [...new Set(trade.mistakes.map(tradeTagKey))]
        : [""];
  }
}

export function filterStatisticTrades(
  trades: readonly Trade[],
  { start = -Infinity, end = Infinity }: TimeWindow,
  filters: TradeFactorFilters,
) {
  const active = (Object.keys(filters) as TradeFactor[]).filter(
    (factor) => filters[factor] !== undefined,
  );
  return trades.filter((trade) => {
    const at = Date.parse(trade.closedAt);
    return (
      at >= start &&
      at < end &&
      active.every((factor) =>
        tradeFactorKeys(trade, factor).some((key) => key === filters[factor]),
      )
    );
  });
}

export function tradeBreakdown(trades: readonly Trade[], factor: TradeFactor) {
  const groups = new Map<string, Trade[]>();
  for (const trade of trades) {
    for (const key of tradeFactorKeys(trade, factor)) {
      const records = groups.get(key);
      if (records) records.push(trade);
      else groups.set(key, [trade]);
    }
  }
  return Array.from(groups, ([key, records]) => ({
    key,
    records,
    metrics: tradeStatistics(records),
  }));
}
