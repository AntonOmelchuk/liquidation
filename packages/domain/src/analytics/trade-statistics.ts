import { netCents, realizedR } from "../trades/trade.ts";
import type { Trade } from "../trades/types.ts";

import { HOURS_IN_MS } from "./constants.ts";
const mean = (values: readonly number[]) =>
  values.length
    ? values.reduce((total, value) => total + value, 0) / values.length
    : null;

function duration(trades: readonly Trade[]) {
  const hours = trades
    .map(
      ({ openedAt, closedAt }) =>
        (Date.parse(closedAt) - Date.parse(openedAt)) / HOURS_IN_MS,
    )
    .sort((a, b) => a - b);
  const middle = Math.floor(hours.length / 2);
  return {
    mean: mean(hours),
    median:
      hours.length % 2
        ? hours[middle]
        : mean(hours.slice(Math.max(0, middle - 1), middle + 1)),
  };
}

export function tradeStatistics(trades: readonly Trade[]) {
  const ordered = trades
    .map((trade) => ({
      trade,
      at: Date.parse(trade.closedAt),
      net: netCents(trade),
      r: realizedR(trade),
    }))
    .sort(
      (a, b) =>
        a.at - b.at ||
        Date.parse(a.trade.openedAt) - Date.parse(b.trade.openedAt) ||
        a.trade.id.localeCompare(b.trade.id),
    );
  const wins = ordered.filter(({ net }) => net > 0);
  const losses = ordered.filter(({ net }) => net < 0);
  const gain = wins.reduce((total, { net }) => total + net, 0);
  const loss = losses.reduce((total, { net }) => total - net, 0);
  const resultsR = ordered.flatMap(({ r }) => (r === null ? [] : [r]));
  const averageWin = wins.length ? gain / wins.length / 100 : null;
  const averageLoss = losses.length ? -loss / losses.length / 100 : null;

  let equity = 0;
  let peak = 0;
  let drawdown = 0;
  let lowest = 0;
  let winRun = 0;
  let lossRun = 0;
  let longestWin = 0;
  let longestLoss = 0;
  for (const [index, { at, net }] of ordered.entries()) {
    winRun = net > 0 ? winRun + 1 : 0;
    lossRun = net < 0 ? lossRun + 1 : 0;
    longestWin = Math.max(longestWin, winRun);
    longestLoss = Math.max(longestLoss, lossRun);

    equity += net;
    // Group simultaneous closes so the curve never implies an unknown fill order.
    if (ordered[index + 1]?.at === at) continue;
    peak = Math.max(peak, equity);
    drawdown = Math.max(drawdown, peak - equity);
    lowest = Math.min(lowest, equity);
  }

  return {
    count: trades.length,
    net: (gain - loss) / 100,
    winRate: trades.length ? wins.length / trades.length : null,
    profitFactor: loss ? gain / loss : gain ? Infinity : null,
    averageWin,
    averageLoss,
    payoff:
      averageWin !== null && averageLoss !== null
        ? averageWin / -averageLoss
        : null,
    expectancy: trades.length ? (gain - loss) / 100 / trades.length : null,
    expectancyR: mean(resultsR),
    totalR: resultsR.length
      ? resultsR.reduce((total, value) => total + value, 0)
      : null,
    countWithRisk: resultsR.length,
    longestWin,
    longestLoss,
    maxDrawdown: drawdown / 100,
    lowestPnl: lowest / 100,
    flat: trades.length - wins.length - losses.length,
    duration: duration(trades),
    winningDuration: duration(wins.map(({ trade }) => trade)),
    losingDuration: duration(losses.map(({ trade }) => trade)),
  };
}
