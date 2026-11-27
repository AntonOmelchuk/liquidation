import {
  CANDLE_INTERVAL,
  MINUTE_MS,
  RELEASE_REACTION_MINUTES,
} from "@liquidation/domain/market/constants";
import {
  measuredWindows,
  measurementKey,
} from "@liquidation/domain/market/release-history";
import type {
  ReactionInterval,
  ReleaseReaction,
  ReleaseReactionQuery,
} from "@liquidation/domain/market/types";
import { z } from "zod";
import {
  BIQUOTE_API_URL,
  COMPLETE_REACTION_CACHE_MS,
  MAX_CACHED_REACTIONS,
  PROVIDER_TIMEOUT_MS,
  REACTION_CANDLE_LIMIT,
  REACTION_RETRY_MS,
} from "./constants.ts";
import type { MarketFeedOptions, ReactionCacheEntry } from "./types.ts";

const candleSchema = z.object({
  openTime: z.iso.datetime({ offset: true }),
  close: z.number().positive(),
  isOpen: z.boolean(),
});
const candleFeedSchema = z.object({
  symbol: z.string(),
  interval: z.enum(CANDLE_INTERVAL),
  bars: z.array(candleSchema),
});
const fiveMinuteMs = MINUTE_MS * RELEASE_REACTION_MINUTES[0];

function emptyReaction(query: ReleaseReactionQuery): ReleaseReaction {
  return { ...query, interval: null, before: null, closes: [null, null] };
}

export function createReleaseReactionReader({
  request = fetch,
  now = Date.now,
}: MarketFeedOptions = {}) {
  const cached = new Map<string, ReactionCacheEntry>();
  const inFlight = new Map<string, Promise<ReleaseReaction | null>>();

  async function measure(
    query: ReleaseReactionQuery,
    interval: ReactionInterval,
    release: number,
    asOf: number,
  ): Promise<ReleaseReaction> {
    const step = interval === CANDLE_INTERVAL.MINUTE ? MINUTE_MS : fiveMinuteMs;
    const url = new URL(
      encodeURIComponent(query.symbol) + "/ohlc",
      BIQUOTE_API_URL,
    );
    url.searchParams.set("interval", interval);
    url.searchParams.set("from", new Date(release - step).toISOString());
    url.searchParams.set(
      "to",
      new Date(
        Math.min(asOf, release + RELEASE_REACTION_MINUTES[1] * MINUTE_MS),
      ).toISOString(),
    );
    url.searchParams.set("limit", String(REACTION_CANDLE_LIMIT));
    const response = await request(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      redirect: "error",
    });
    if (!response.ok) throw new Error("Candle feed unavailable.");
    const feed = candleFeedSchema.parse(await response.json());
    if (feed.symbol !== query.symbol || feed.interval !== interval)
      throw new Error("Candle feed does not match the request.");

    const pricesAt = new Map<number, number>();
    for (const bar of feed.bars) {
      const end = Date.parse(bar.openTime) + step;
      if (!bar.isOpen && end <= asOf) pricesAt.set(end, bar.close);
    }
    const before = pricesAt.get(release);
    if (before === undefined) return emptyReaction(query);

    const scheduled = Date.parse(query.at);
    function closeAfter(minutes: number) {
      const offset = minutes * MINUTE_MS;
      return scheduled + offset <= asOf
        ? (pricesAt.get(release + offset) ?? null)
        : null;
    }

    return {
      ...query,
      interval,
      before,
      closes: [
        closeAfter(RELEASE_REACTION_MINUTES[0]),
        closeAfter(RELEASE_REACTION_MINUTES[1]),
      ],
    };
  }

  async function refresh(
    query: ReleaseReactionQuery,
    eventTime: number,
    asOf: number,
  ) {
    const releaseMinute = Math.floor(eventTime / MINUTE_MS) * MINUTE_MS;
    const elapsed = asOf - eventTime;
    const expected = RELEASE_REACTION_MINUTES.filter(
      (minutes) => elapsed >= minutes * MINUTE_MS,
    ).length;
    let primary: ReleaseReaction | null = null;
    try {
      primary = await measure(
        query,
        CANDLE_INTERVAL.MINUTE,
        releaseMinute,
        asOf,
      );
    } catch {
      // The fallback candle interval can still be available.
    }

    if (measuredWindows(primary) < expected && eventTime % fiveMinuteMs === 0) {
      try {
        const fallback = await measure(
          query,
          CANDLE_INTERVAL.FIVE_MINUTES,
          eventTime,
          asOf,
        );
        if (!primary || measuredWindows(fallback) > measuredWindows(primary))
          return fallback;
      } catch {
        // Keep the available minute-level observations.
      }
    }

    return primary;
  }

  return async function read(
    query: ReleaseReactionQuery,
  ): Promise<ReleaseReaction | null> {
    const asOf = now();
    const eventTime = Date.parse(query.at);
    if (asOf < eventTime + fiveMinuteMs) return emptyReaction(query);
    const key = measurementKey(query);
    const existing = cached.get(key);
    if (existing && asOf < existing.expiresAt) return existing.response;
    const shared = inFlight.get(key);
    if (shared) return shared;

    const pending = refresh(query, eventTime, asOf)
      .then((fresh) => {
        const result =
          existing &&
          measuredWindows(existing.response) > measuredWindows(fresh)
            ? existing.response
            : fresh;
        if (result) {
          cached.delete(key);
          const expiresAt =
            now() +
            (measuredWindows(result) === RELEASE_REACTION_MINUTES.length
              ? COMPLETE_REACTION_CACHE_MS
              : REACTION_RETRY_MS);
          cached.set(key, { response: result, expiresAt });
          if (cached.size > MAX_CACHED_REACTIONS) {
            const oldest = cached.keys().next().value;
            if (oldest !== undefined) cached.delete(oldest);
          }
        }
        return result;
      })
      .finally(() => inFlight.delete(key));
    inFlight.set(key, pending);
    return pending;
  };
}
