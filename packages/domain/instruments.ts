const currencies = {
  USD: ["US dollar", "🇺🇸"],
  EUR: ["Euro", "🇪🇺"],
  GBP: ["British pound", "🇬🇧"],
  JPY: ["Japanese yen", "🇯🇵"],
  CHF: ["Swiss franc", "🇨🇭"],
  CAD: ["Canadian dollar", "🇨🇦"],
  AUD: ["Australian dollar", "🇦🇺"],
  NZD: ["New Zealand dollar", "🇳🇿"],
  SEK: ["Swedish krona", "🇸🇪"],
  NOK: ["Norwegian krone", "🇳🇴"],
  MXN: ["Mexican peso", "🇲🇽"],
  ZAR: ["South African rand", "🇿🇦"],
  SGD: ["Singapore dollar", "🇸🇬"],
} as const;

type Currency = keyof typeof currencies;
type Instrument = { symbol: string; name: string; icons: readonly string[] };

const forexPairs = {
  EUR: ["USD", "GBP", "JPY", "CHF", "CAD", "AUD", "NZD", "SEK", "NOK"],
  GBP: ["USD", "JPY", "CHF", "CAD", "AUD", "NZD"],
  USD: ["JPY", "CHF", "CAD", "SEK", "NOK", "MXN", "ZAR", "SGD"],
  AUD: ["USD", "JPY", "CHF", "CAD", "NZD"],
  NZD: ["USD", "JPY", "CHF", "CAD"],
  CAD: ["JPY", "CHF"],
  CHF: ["JPY"],
} satisfies Partial<Record<Currency, Currency[]>>;

const otherInstruments = [
  ["XAUUSD", "Gold / US dollar", "Au"],
  ["XAGUSD", "Silver / US dollar", "Ag"],
  ["XPTUSD", "Platinum / US dollar", "Pt"],
  ["XPDUSD", "Palladium / US dollar", "Pd"],
  ["NAS100", "Nasdaq 100", "🇺🇸"],
  ["US500", "S&P 500", "🇺🇸"],
  ["US30", "Dow Jones Industrial Average", "🇺🇸"],
  ["DXY", "US Dollar Index", "🇺🇸"],
  ["GER40", "DAX", "🇩🇪"],
  ["UK100", "FTSE 100", "🇬🇧"],
  ["JP225", "Nikkei 225", "🇯🇵"],
  ["EU50", "Euro Stoxx 50", "🇪🇺"],
  ["USOIL", "WTI crude oil", "WTI"],
  ["UKOIL", "Brent crude oil", "BR"],
  ["BTCUSD", "Bitcoin / US dollar", "₿"],
  ["ETHUSD", "Ethereum / US dollar", "Ξ"],
  ["SOLUSD", "Solana / US dollar", "SOL"],
  ["AAPL", "Apple", "A"],
  ["MSFT", "Microsoft", "M"],
  ["NVDA", "NVIDIA", "N"],
  ["TSLA", "Tesla", "T"],
  ["ES", "E-mini S&P 500 futures", "ES"],
  ["NQ", "E-mini Nasdaq 100 futures", "NQ"],
  ["GC", "Gold futures", "Au"],
  ["CL", "WTI crude oil futures", "WTI"],
] as const;

const instruments: readonly Instrument[] = [
  ...Object.entries(forexPairs).flatMap(([base, quotes]) => {
    const [baseName, baseIcon] = currencies[base as Currency];
    return quotes.map((quote) => {
      const [quoteName, quoteIcon] = currencies[quote];
      return {
        symbol: base + quote,
        name: `${baseName} / ${quoteName}`,
        icons: [baseIcon, quoteIcon],
      };
    });
  }),
  ...otherInstruments.map(([symbol, name, icon]) => ({
    symbol,
    name,
    icons: [icon],
  })),
];

const bySymbol = new Map(
  instruments.map((instrument) => [instrument.symbol, instrument]),
);

export function instrumentIcons(symbol: string): readonly string[] {
  const normalized = symbol.trim().toUpperCase();
  const base = normalized.split(/[._]/, 1)[0];
  return (
    bySymbol.get(normalized)?.icons ??
    bySymbol.get(base)?.icons ?? [normalized.slice(0, 2) || "?"]
  );
}

export function searchInstruments(query: string) {
  const term = query.trim().toUpperCase();
  const ticker = term.replace(/[\s/-]/g, "");
  return instruments
    .filter(
      ({ symbol, name }) =>
        (ticker !== "" && symbol.includes(ticker)) ||
        name.toUpperCase().includes(term),
    )
    .toSorted((first, second) => {
      const rank = (symbol: string) =>
        symbol === ticker ? 0 : symbol.startsWith(ticker) ? 1 : 2;
      return rank(first.symbol) - rank(second.symbol);
    });
}
