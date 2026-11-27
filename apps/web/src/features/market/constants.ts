import {
  CALENDAR_SOURCE,
  QUOTE_METALS,
} from "@liquidation/domain/market/constants";

export const DEFAULT_QUOTE_SYMBOLS = ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD"];
export const CALENDAR_POLL_MS = 60_000;
export const CALENDAR_CLOCK_MS = 15_000;
export const REACTION_POLL_MS = 30_000;
export const RELEASE_TIMING = { PAST: "past", NEXT: "next" } as const;
export const QUOTE_POLL_MS = 5_000;
export const QUOTE_FRESH_MS = 75_000;
export const QUOTE_SCROLL_PX_PER_SECOND = 42;

export const MARKET_LINKS = {
  [CALENDAR_SOURCE.FOREX_FACTORY]: "https://www.forexfactory.com/calendar",
  [CALENDAR_SOURCE.BIQUOTE]: "https://biquote.io/",
} as const;

export const METAL_QUOTE_SYMBOLS = new Set<string>(QUOTE_METALS);
export const JPY_QUOTE_CURRENCY = "JPY";
