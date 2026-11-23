import { TRADE_SIDE } from "../trades/constants.ts";
import type { Position, Trade } from "../trades/types.ts";
import { PLAN_NARRATIVE } from "./constants.ts";
import { getPlanNarrative } from "./plan-lifecycle.ts";
import type { ExecutionTotals, Plan } from "./types.ts";

import { netCents, realizedR } from "../trades/trade.ts";

function totals(trades: readonly Trade[], open: number): ExecutionTotals {
  let cents = 0;
  let sumR = 0;
  let measured = 0;
  let wins = 0;
  let losses = 0;
  for (const trade of trades) {
    const net = netCents(trade);
    const result = realizedR(trade);
    cents += net;
    if (net > 0) wins += 1;
    if (net < 0) losses += 1;
    if (result !== null) {
      measured += 1;
      sumR += result;
    }
  }

  const closed = trades.length;
  return {
    count: closed + open,
    closed,
    open,
    wins,
    losses,
    flat: closed - wins - losses,
    net: cents / 100,
    totalR: measured ? sumR : null,
    missingRisk: closed - measured,
    winRate: closed ? wins / closed : null,
  };
}

export function planExecution(
  plan: Plan,
  trades: readonly Trade[],
  positions: readonly Position[],
) {
  const narrative = getPlanNarrative(plan.originalSetup ?? plan.setup);
  const actual = totals(trades, positions.length);
  if (narrative === PLAN_NARRATIVE.NEUTRAL)
    return { actual, narrative, alignment: null };
  const direction =
    narrative === PLAN_NARRATIVE.BULLISH
      ? TRADE_SIDE.LONG
      : narrative === PLAN_NARRATIVE.BEARISH
        ? TRADE_SIDE.SHORT
        : null;
  const follows = (entry: Pick<Trade, "direction">) =>
    entry.direction === direction;

  return {
    actual,
    narrative,
    alignment: {
      withNarrative: totals(
        trades.filter(follows),
        positions.filter(follows).length,
      ),
      againstNarrative: totals(
        trades.filter((trade) => !follows(trade)),
        positions.filter((position) => !follows(position)).length,
      ),
    },
  };
}

export function indexPlanExecution(
  plans: readonly Plan[],
  trades: readonly Trade[],
  positions: readonly Position[],
) {
  const tradesByPlan = Map.groupBy(trades, ({ planId }) => planId);
  const positionsByPlan = Map.groupBy(positions, ({ planId }) => planId);
  return new Map(
    plans.map((plan) => [
      plan.id,
      planExecution(
        plan,
        tradesByPlan.get(plan.id) ?? [],
        positionsByPlan.get(plan.id) ?? [],
      ),
    ]),
  );
}
