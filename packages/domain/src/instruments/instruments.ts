import {
  currencies,
  forexPairs,
  INSTRUMENT_MARKET,
  otherInstruments,
} from "./constants.ts";
import type { Currency, Instrument } from "./types.ts";

const instruments: readonly Instrument[] = [
  ...Object.entries(forexPairs).flatMap(([base, quotes]) => {
    const [baseName, baseIcon] = currencies[base as Currency];
    return quotes.map((quote) => {
      const [quoteName, quoteIcon] = currencies[quote];
      return {
        symbol: base + quote,
        name: `${baseName} / ${quoteName}`,
        icons: [baseIcon, quoteIcon],
        market: INSTRUMENT_MARKET.FOREX,
      };
    });
  }),
  ...otherInstruments.map(([symbol, name, icon, market]) => ({
    symbol,
    name,
    icons: [icon],
    market,
  })),
];

const bySymbol = new Map(
  instruments.map((instrument) => [instrument.symbol, instrument]),
);

export function currencyFlag(code: string) {
  const currency = code.trim().toUpperCase();
  return Object.hasOwn(currencies, currency)
    ? currencies[currency as Currency][1]
    : undefined;
}

export function instrumentMarket(
  symbol: string,
): Instrument["market"] | undefined {
  const normalized = symbol.trim().toUpperCase();
  const base = normalized.split(/[._]/, 1)[0];
  return (
    bySymbol.get(normalized)?.market ??
    bySymbol.get(base)?.market ??
    (currencyFlag(normalized) ? INSTRUMENT_MARKET.FOREX : undefined)
  );
}

export function instrumentIcons(symbol: string): readonly string[] {
  const normalized = symbol.trim().toUpperCase();
  const base = normalized.split(/[._]/, 1)[0];
  const flag = currencyFlag(normalized);
  return (
    bySymbol.get(normalized)?.icons ??
    bySymbol.get(base)?.icons ?? [flag ?? (normalized.slice(0, 2) || "?")]
  );
}

export function searchInstruments(query: string) {
  const term = query.trim().toUpperCase();
  const ticker = term.replace(/[\s/-]/g, "");
  return instruments
    .filter(
      ({ symbol, name }) =>
        (ticker && symbol.includes(ticker)) ||
        name.toUpperCase().includes(term),
    )
    .toSorted((first, second) => {
      const rank = (symbol: string) =>
        symbol === ticker ? 0 : symbol.startsWith(ticker) ? 1 : 2;
      return rank(first.symbol) - rank(second.symbol);
    });
}
