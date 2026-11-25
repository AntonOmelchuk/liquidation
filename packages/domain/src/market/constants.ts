import { forexPairs } from "../instruments/constants.ts";

export const MARKET_ROUTES = {
  calendar: "/api/market/calendar",
  quotes: "/api/market/quotes",
  reaction: "/api/market/reaction",
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
export const QUOTE_SYMBOLS = [
  ...Object.entries(forexPairs).flatMap(([base, quotes]) =>
    quotes.map((quote) => base + quote),
  ),
  ...QUOTE_METALS,
];

export const MINUTE_MS = 60_000;
export const RELEASE_REACTION_MINUTES = [5, 15] as const;
export const CANDLE_INTERVAL = { MINUTE: "1m", FIVE_MINUTES: "5m" } as const;

export const MARKET_IMPACT = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
} as const;

export const MARKET_PROVIDER = {
  [CALENDAR_SOURCE.FOREX_FACTORY]: "Forex Factory",
  [CALENDAR_SOURCE.BIQUOTE]: "biquote",
} as const;
