import { JPY_QUOTE_CURRENCY, METAL_QUOTE_SYMBOLS } from "./constants.ts";

export function quotePriceDigits(symbol: string) {
  if (METAL_QUOTE_SYMBOLS.has(symbol)) return 2;
  return symbol.endsWith(JPY_QUOTE_CURRENCY) ? 3 : 5;
}

export function reactionFormatters(
  locale: string,
  symbol: string,
  pips: string,
) {
  const digits = quotePriceDigits(symbol);
  const metal = METAL_QUOTE_SYMBOLS.has(symbol);
  const pipSize = symbol.endsWith(JPY_QUOTE_CURRENCY) ? 0.01 : 0.0001;
  const price = new Intl.NumberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  const percent = new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 3,
    signDisplay: "exceptZero",
  });
  const signed = new Intl.NumberFormat(locale, {
    maximumFractionDigits: metal ? 2 : 1,
    signDisplay: "exceptZero",
  });
  return {
    price,
    percent,
    move: (delta: number) =>
      metal
        ? signed.format(delta) + " USD"
        : signed.format(delta / pipSize) + " " + pips,
  };
}
