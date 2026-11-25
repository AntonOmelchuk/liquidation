import { z } from "zod";
import { TRADE_SIDE } from "./constants.ts";
import type { TradeDirection, TradePrices } from "./types.ts";

const price = z.number().positive().max(1_000_000_000).optional();

export const tradePricesSchema = z.object({
  entry: price,
  stop: price,
  target: price,
  exit: price,
  favorable: price,
  adverse: price,
});

export function validPriceGeometry(
  direction: TradeDirection,
  prices?: TradePrices,
) {
  if (!prices || prices.entry === undefined) return true;
  const { entry, stop, target, favorable, adverse, exit } = prices;
  const sign = direction === TRADE_SIDE.LONG ? 1 : -1;
  return (
    (stop === undefined || sign * (entry - stop) > 0) &&
    (target === undefined || sign * (target - entry) > 0) &&
    (favorable === undefined || sign * (favorable - entry) >= 0) &&
    (adverse === undefined || sign * (adverse - entry) <= 0) &&
    (exit === undefined ||
      favorable === undefined ||
      sign * (favorable - exit) >= 0) &&
    (exit === undefined ||
      adverse === undefined ||
      sign * (exit - adverse) >= 0)
  );
}

export function priceMoveR(
  direction: TradeDirection,
  prices: TradePrices | undefined,
  price: number | undefined,
) {
  const entry = prices?.entry;
  const stop = prices?.stop;
  if (
    entry === undefined ||
    stop === undefined ||
    stop === entry ||
    price === undefined
  )
    return null;
  const sign = direction === TRADE_SIDE.LONG ? 1 : -1;
  return (sign * (price - entry)) / Math.abs(entry - stop);
}
