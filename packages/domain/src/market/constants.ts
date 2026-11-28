import { forexPairs } from "../instruments/constants.ts";

export const MARKET_ROUTES = {
  calendar: "/api/market/calendar",
  quotes: "/api/market/quotes",
  reaction: "/api/market/reaction",
  reactions: "/api/market/reactions",
} as const;

export const CALENDAR_STATE = {
  READY: "ready",
  STALE: "stale",
  UNAVAILABLE: "unavailable",
} as const;

export const CALENDAR_SOURCE = {
  FOREX_FACTORY: "forex-factory",
  BIQUOTE: "biquote",
} as const;

export const MAX_QUOTE_SYMBOLS = 8;
export const QUOTE_METALS = ["XAUUSD", "XAGUSD"] as const;
export const QUOTE_FX_PAIRS = Object.entries(forexPairs).flatMap(
  ([base, quotes]) =>
    quotes.map((quote) => ({ base, quote, symbol: base + quote })),
);
export const QUOTE_SYMBOLS = [
  ...QUOTE_FX_PAIRS.map(({ symbol }) => symbol),
  ...QUOTE_METALS,
];

export const MINUTE_MS = 60_000;
export const RELEASE_REACTION_MINUTES = [5, 15] as const;
export const NEWS_REMINDER_MINUTES = 15;
export const NEWS_REMINDER_WINDOW_MS = NEWS_REMINDER_MINUTES * MINUTE_MS;
export const CANDLE_INTERVAL = { MINUTE: "1m", FIVE_MINUTES: "5m" } as const;

export const EURUSD = "EURUSD";
export const CHINESE_YUAN = "CNY";
export const OFFSHORE_YUAN_PAIR = "USDCNH";
export const RELEASE_SYMBOLS = new Map([
  ["USD", EURUSD],
  ["EUR", EURUSD],
  ["GBP", "GBPUSD"],
  ["JPY", "USDJPY"],
  ["CHF", "USDCHF"],
  ["CAD", "USDCAD"],
  ["AUD", "AUDUSD"],
  ["NZD", "NZDUSD"],
  [CHINESE_YUAN, OFFSHORE_YUAN_PAIR],
]);

export const FORECAST_RESULT = {
  ABOVE: "above",
  BELOW: "below",
  INLINE: "inline",
  MISSING: "missing",
} as const;
export const FORECAST_RESULTS = Object.values(FORECAST_RESULT);
export const PERCENT_READING_UNIT = "%";
export const READING_SCALE = new Map([
  ["K", 3],
  ["M", 6],
  ["B", 9],
  ["T", 12],
]);

export const MARKET_IMPACT = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
} as const;

export const NEWS_CURRENCY_BY_SYMBOL = new Map([
  ["DXY", "USD"],
  ["NAS100", "USD"],
  ["US500", "USD"],
  ["SPX500", "USD"],
  ["US30", "USD"],
  ["NQ", "USD"],
  ["ES", "USD"],
  ["GC", "USD"],
  ["CL", "USD"],
  ["USOIL", "USD"],
  ["GER40", "EUR"],
  ["EU50", "EUR"],
  ["UK100", "GBP"],
  ["JP225", "JPY"],
]);
export const METAL_CODES = new Set(["XAU", "XAG", "XPT", "XPD"]);
export const OFFSHORE_YUAN = "CNH";

export const MARKET_PROVIDER = {
  [CALENDAR_SOURCE.FOREX_FACTORY]: "Forex Factory",
  [CALENDAR_SOURCE.BIQUOTE]: "biquote",
} as const;
