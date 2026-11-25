import { JPY_QUOTE_CURRENCY, METAL_QUOTE_SYMBOLS } from "./constants.ts";

export function quotePriceDigits(symbol: string) {
  if (METAL_QUOTE_SYMBOLS.has(symbol)) return 2;
  return symbol.endsWith(JPY_QUOTE_CURRENCY) ? 3 : 5;
}
