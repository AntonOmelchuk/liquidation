export const FOREX_FACTORY_EXPORT =
  "https://nfs.faireconomy.media/ff_calendar_thisweek.json";
export const FOREX_FACTORY_CACHE_MS = 60 * 60_000;
export const FOREX_FACTORY_RETRY_MS = 5 * 60_000;
export const PROVIDER_TIMEOUT_MS = 8_000;

export const BIQUOTE_API_URL = "https://biquote.io/api/";
export const BIQUOTE_CALENDAR_URL = BIQUOTE_API_URL + "calendar";
export const BIQUOTE_CALENDAR_CACHE_MS = 60_000;
export const BIQUOTE_CALENDAR_COUNTRIES = "US,EU,GB,JP,CH,CA,AU,NZ,CN";
export const BIQUOTE_CALENDAR_LIMIT = 500;
export const BIQUOTE_QUOTES_URL = BIQUOTE_API_URL + "latest";
export const QUOTE_RETRY_MS = 15_000;
export const BIQUOTE_MARKET_CLOSED = "closed";
export const BIQUOTE_TIME_EXACT = "exact";
export const BIQUOTE_TIME_DATE = "date";
export const BIQUOTE_HOLIDAY = "holiday";
export const BIQUOTE_PERCENT = "percent";
export const BIQUOTE_VALUE_SUFFIX = {
  thousands: "K",
  millions: "M",
  billions: "B",
  trillions: "T",
} as const;

export const REACTION_CANDLE_LIMIT = 32;
export const REACTION_RETRY_MS = 30_000;
export const COMPLETE_REACTION_CACHE_MS = 60 * 60_000;
export const MAX_CACHED_REACTIONS = 128;
