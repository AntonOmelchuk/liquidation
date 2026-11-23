import { z } from "zod";
import { TRADE_SIDE } from "./constants.ts";
import { tradeLinksSchema } from "./trade-links.ts";
import type { Trade } from "./types.ts";

const money = z
  .number()
  .min(-1_000_000_000)
  .max(1_000_000_000)
  .multipleOf(0.01);
export const tradeInput = z
  .object({
    symbol: z
      .string()
      .trim()
      .min(1)
      .max(24)
      .transform((value) => value.toUpperCase()),
    direction: z.enum(TRADE_SIDE),
    openedAt: z.iso.datetime(),
    closedAt: z.iso.datetime(),
    profit: money,
    commission: money,
    swap: money,
    risk: money.positive().nullable(),
    notes: z.string().trim().max(4000),
    ...tradeLinksSchema.shape,
  })
  .refine((trade) => Date.parse(trade.openedAt) <= Date.parse(trade.closedAt), {
    path: ["closedAt"],
    message: "Closing time must follow opening time.",
  });

export const tradeSchema = tradeInput.safeExtend({ id: z.uuid() });

export function netCents(trade: Pick<Trade, "profit" | "commission" | "swap">) {
  return (
    Math.round(trade.profit * 100) +
    Math.round(trade.commission * 100) +
    Math.round(trade.swap * 100)
  );
}

export function realizedR(
  trade: Pick<Trade, "profit" | "commission" | "swap" | "risk">,
) {
  const riskCents = trade.risk === null ? 0 : Math.round(trade.risk * 100);
  return riskCents > 0 ? netCents(trade) / riskCents : null;
}

export function summarize(trades: readonly Trade[]) {
  const results = trades.map(netCents);
  return {
    count: results.length,
    net: results.reduce((total, value) => total + value, 0) / 100,
    winRate: results.length
      ? results.filter((value) => value > 0).length / results.length
      : null,
  };
}
