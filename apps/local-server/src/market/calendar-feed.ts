import {
  CALENDAR_SOURCE,
  CALENDAR_STATE,
} from "@liquidation/domain/market/constants";
import type { CalendarFeed } from "@liquidation/domain/market/types";
import { biquoteCalendarUrl, parseBiquoteEvents } from "./biquote-calendar.ts";
import {
  BIQUOTE_CALENDAR_CACHE_MS,
  FOREX_FACTORY_CACHE_MS,
  FOREX_FACTORY_EXPORT,
  FOREX_FACTORY_RETRY_MS,
  PROVIDER_TIMEOUT_MS,
} from "./constants.ts";
import { parseForexFactoryEvents } from "./forex-factory-calendar.ts";
import type { CalendarParser, MarketFeedOptions } from "./types.ts";

export function createCalendarFeed({
  request = fetch,
  now = Date.now,
}: MarketFeedOptions = {}) {
  let current: CalendarFeed = {
    source: CALENDAR_SOURCE.BIQUOTE,
    state: CALENDAR_STATE.UNAVAILABLE,
    events: [],
    fetchedAt: null,
  };
  let refreshAt = 0;
  let fallback: CalendarFeed | undefined;
  let fallbackRefreshAt = 0;
  let pending: Promise<CalendarFeed> | undefined;

  async function retrieve(
    url: URL,
    parse: CalendarParser,
    source: CalendarFeed["source"],
  ): Promise<CalendarFeed> {
    const response = await request(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      redirect: "error",
    });
    if (!response.ok) throw new Error("Calendar provider unavailable.");
    const payload: unknown = await response.json();
    return {
      source,
      state: CALENDAR_STATE.READY,
      events: parse(payload),
      fetchedAt: new Date(now()).toISOString(),
    };
  }

  async function readFallback() {
    if (now() >= fallbackRefreshAt) {
      try {
        fallback = await retrieve(
          new URL(FOREX_FACTORY_EXPORT),
          parseForexFactoryEvents,
          CALENDAR_SOURCE.FOREX_FACTORY,
        );
        fallbackRefreshAt = now() + FOREX_FACTORY_CACHE_MS;
      } catch {
        if (fallback) fallback = { ...fallback, state: CALENDAR_STATE.STALE };
        fallbackRefreshAt = now() + FOREX_FACTORY_RETRY_MS;
      }
    }
    return fallback;
  }

  async function refresh() {
    try {
      current = await retrieve(
        biquoteCalendarUrl(now()),
        parseBiquoteEvents,
        CALENDAR_SOURCE.BIQUOTE,
      );
    } catch {
      current = (await readFallback()) ?? {
        ...current,
        state: current.fetchedAt
          ? CALENDAR_STATE.STALE
          : CALENDAR_STATE.UNAVAILABLE,
      };
    }
    refreshAt = now() + BIQUOTE_CALENDAR_CACHE_MS;
    return current;
  }

  return async function read() {
    if (now() < refreshAt) return current;
    pending ??= refresh().finally(() => {
      pending = undefined;
    });
    return pending;
  };
}
