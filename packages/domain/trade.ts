import { z } from "zod";

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
    direction: z.enum(["long", "short"]),
    openedAt: z.iso.datetime(),
    closedAt: z.iso.datetime(),
    profit: money,
    commission: money,
    swap: money,
    risk: money.positive().nullable(),
    notes: z.string().trim().max(4000),
  })
  .refine((trade) => Date.parse(trade.openedAt) <= Date.parse(trade.closedAt), {
    path: ["closedAt"],
    message: "Closing time must follow opening time.",
  });

export const tradeSchema = tradeInput.safeExtend({ id: z.uuid() });
export type Trade = z.infer<typeof tradeSchema>;

export function netCents(trade: Pick<Trade, "profit" | "commission" | "swap">) {
  return (
    Math.round(trade.profit * 100) +
    Math.round(trade.commission * 100) +
    Math.round(trade.swap * 100)
  );
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
