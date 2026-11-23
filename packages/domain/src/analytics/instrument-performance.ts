import { netCents } from "../trades/trade.ts";
import type { Trade } from "../trades/types.ts";
import type { InstrumentTotals } from "./types.ts";

export function performanceByInstrument(trades: readonly Trade[]) {
  const groups = new Map<string, InstrumentTotals>();
  for (const trade of trades) {
    const symbol = trade.symbol;
    const totals = groups.get(symbol) ?? {
      count: 0,
      wins: 0,
      gains: 0,
      losses: 0,
    };
    const net = netCents(trade);
    totals.count += 1;
    if (net > 0) {
      totals.wins += 1;
      totals.gains += net;
    } else {
      totals.losses -= net;
    }
    groups.set(symbol, totals);
  }

  return [...groups]
    .map(([symbol, { count, wins, gains, losses }]) => ({
      symbol,
      count,
      winRate: wins / count,
      net: (gains - losses) / 100,
      profitFactor: losses > 0 ? gains / losses : gains > 0 ? Infinity : null,
    }))
    .sort((a, b) => b.net - a.net || a.symbol.localeCompare(b.symbol));
}
