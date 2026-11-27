import type { Currency } from "./types.ts";

export const INSTRUMENT_MARKET = {
  FOREX: "forex",
  INDICES: "indices",
  COMMODITIES: "commodities",
  EQUITIES: "equities",
  CRYPTO: "crypto",
  OTHER: "other",
} as const;

export const currencies = {
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
  CNY: ["Chinese yuan", "🇨🇳"],
  CNH: ["Offshore Chinese yuan", "🇨🇳"],
} as const;

export const forexPairs = {
  EUR: ["USD", "GBP", "JPY", "CHF", "CAD", "AUD", "NZD", "SEK", "NOK"],
  GBP: ["USD", "JPY", "CHF", "CAD", "AUD", "NZD"],
  USD: ["JPY", "CHF", "CAD", "SEK", "NOK", "MXN", "ZAR", "SGD", "CNH"],
  AUD: ["USD", "JPY", "CHF", "CAD", "NZD"],
  NZD: ["USD", "JPY", "CHF", "CAD"],
  CAD: ["JPY", "CHF"],
  CHF: ["JPY"],
} satisfies Partial<Record<Currency, Currency[]>>;

export const otherInstruments = [
  ["XAUUSD", "Gold / US dollar", "Au", INSTRUMENT_MARKET.COMMODITIES],
  ["XAGUSD", "Silver / US dollar", "Ag", INSTRUMENT_MARKET.COMMODITIES],
  ["XPTUSD", "Platinum / US dollar", "Pt", INSTRUMENT_MARKET.COMMODITIES],
  ["XPDUSD", "Palladium / US dollar", "Pd", INSTRUMENT_MARKET.COMMODITIES],
  ["NAS100", "Nasdaq 100", "🇺🇸", INSTRUMENT_MARKET.INDICES],
  ["US500", "S&P 500", "🇺🇸", INSTRUMENT_MARKET.INDICES],
  ["SPX500", "S&P 500", "🇺🇸", INSTRUMENT_MARKET.INDICES],
  ["US30", "Dow Jones Industrial Average", "🇺🇸", INSTRUMENT_MARKET.INDICES],
  ["DXY", "US Dollar Index", "🇺🇸", INSTRUMENT_MARKET.INDICES],
  ["GER40", "DAX", "🇩🇪", INSTRUMENT_MARKET.INDICES],
  ["UK100", "FTSE 100", "🇬🇧", INSTRUMENT_MARKET.INDICES],
  ["JP225", "Nikkei 225", "🇯🇵", INSTRUMENT_MARKET.INDICES],
  ["EU50", "Euro Stoxx 50", "🇪🇺", INSTRUMENT_MARKET.INDICES],
  ["USOIL", "WTI crude oil", "WTI", INSTRUMENT_MARKET.COMMODITIES],
  ["UKOIL", "Brent crude oil", "BR", INSTRUMENT_MARKET.COMMODITIES],
  ["BTCUSD", "Bitcoin / US dollar", "₿", INSTRUMENT_MARKET.CRYPTO],
  ["ETHUSD", "Ethereum / US dollar", "Ξ", INSTRUMENT_MARKET.CRYPTO],
  ["SOLUSD", "Solana / US dollar", "SOL", INSTRUMENT_MARKET.CRYPTO],
  ["AAPL", "Apple", "A", INSTRUMENT_MARKET.EQUITIES],
  ["MSFT", "Microsoft", "M", INSTRUMENT_MARKET.EQUITIES],
  ["NVDA", "NVIDIA", "N", INSTRUMENT_MARKET.EQUITIES],
  ["TSLA", "Tesla", "T", INSTRUMENT_MARKET.EQUITIES],
  ["ES", "E-mini S&P 500 futures", "ES", INSTRUMENT_MARKET.INDICES],
  ["NQ", "E-mini Nasdaq 100 futures", "NQ", INSTRUMENT_MARKET.INDICES],
  ["GC", "Gold futures", "Au", INSTRUMENT_MARKET.COMMODITIES],
  ["CL", "WTI crude oil futures", "WTI", INSTRUMENT_MARKET.COMMODITIES],
] as const;
