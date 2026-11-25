import {
  CALENDAR_SOURCE,
  CALENDAR_STATE,
  MARKET_ROUTES,
} from "@liquidation/domain/market/constants";
import {
  calendarFeedSchema,
  quoteSnapshotSchema,
  releaseReactionSchema,
} from "@liquidation/domain/market/contracts";
import type {
  CalendarFeed,
  ReleaseReactionQuery,
} from "@liquidation/domain/market/types";
import { useEffect, useState } from "react";
import {
  CALENDAR_POLL_MS,
  QUOTE_POLL_MS,
  REACTION_POLL_MS,
} from "./constants.ts";
import type { PollResult } from "./types.ts";

function useMarketFeed<Data>(
  url: string | undefined,
  schema: { parse: (input: unknown) => Data },
  interval: number,
) {
  const [result, setResult] = useState<PollResult<Data>>();

  useEffect(() => {
    if (!url) return;
    const endpoint = url;
    const controller = new AbortController();
    let pending = false;

    async function refresh() {
      if (pending || document.hidden) return;
      pending = true;
      try {
        const response = await fetch(endpoint, { signal: controller.signal });
        if (!response.ok) throw new Error("Market data is unavailable.");
        const data = schema.parse(await response.json());
        if (!controller.signal.aborted)
          setResult({
            url: endpoint,
            data,
            failed: false,
            receivedAt: Date.now(),
          });
      } catch {
        if (!controller.signal.aborted) {
          const receivedAt = Date.now();
          setResult((previous) => ({
            url: endpoint,
            data: previous?.url === endpoint ? previous.data : undefined,
            failed: true,
            receivedAt,
          }));
        }
      } finally {
        pending = false;
      }
    }

    void refresh();
    const timer = window.setInterval(() => void refresh(), interval);
    const whenVisible = () => void refresh();
    document.addEventListener("visibilitychange", whenVisible);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", whenVisible);
    };
  }, [url, interval, schema]);

  return result?.url === url ? result : undefined;
}

export function useCalendarFeed(): CalendarFeed | undefined {
  const result = useMarketFeed(
    MARKET_ROUTES.calendar,
    calendarFeedSchema,
    CALENDAR_POLL_MS,
  );
  const data = result?.data;
  if (!result?.failed) return data;
  return {
    source: data?.source ?? CALENDAR_SOURCE.BIQUOTE,
    state: data?.fetchedAt ? CALENDAR_STATE.STALE : CALENDAR_STATE.UNAVAILABLE,
    events: data?.events ?? [],
    fetchedAt: data?.fetchedAt ?? null,
  };
}

export function useQuoteFeed(selection: string) {
  const query = new URLSearchParams({ symbols: selection });
  const result = useMarketFeed(
    selection ? MARKET_ROUTES.quotes + "?" + query : undefined,
    quoteSnapshotSchema,
    QUOTE_POLL_MS,
  );
  return {
    prices: result?.data,
    unavailable: Boolean(result?.failed),
    receivedAt: result?.receivedAt ?? 0,
  };
}

export function useReleaseReaction(query: ReleaseReactionQuery | undefined) {
  const url = query
    ? MARKET_ROUTES.reaction + "?" + new URLSearchParams(query)
    : undefined;
  return useMarketFeed(url, releaseReactionSchema, REACTION_POLL_MS);
}
