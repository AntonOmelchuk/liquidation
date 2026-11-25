import { quoteSymbolSchema } from "@liquidation/domain/market/contracts";
import type { QuoteSnapshot } from "@liquidation/domain/market/types";
import { z } from "zod";
import {
  BIQUOTE_MARKET_CLOSED,
  BIQUOTE_QUOTES_URL,
  PROVIDER_TIMEOUT_MS,
  QUOTE_RETRY_MS,
} from "./constants.ts";
import type { MarketFeedOptions } from "./types.ts";

const tick = z.object({
  symbol: quoteSymbolSchema,
  mid: z.number().positive(),
  timestamp: z.iso.datetime({ offset: true }),
  marketState: z.string(),
  stale: z.boolean(),
  dayDiffPercent: z.number().nullish(),
});
const snapshot = z.record(z.string(), z.unknown());

export function createQuoteReader({
  request = fetch,
  now = Date.now,
}: MarketFeedOptions = {}) {
  let retryAt = 0;

  return async function read(
    symbols: readonly string[],
  ): Promise<QuoteSnapshot | null> {
    if (now() < retryAt) return null;
    const url = new URL(BIQUOTE_QUOTES_URL);
    for (const symbol of symbols) url.searchParams.append("symbols", symbol);
    try {
      const response = await request(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
        redirect: "error",
      });
      if (!response.ok) {
        const retry = Number(response.headers.get("Retry-After"));
        if (Number.isFinite(retry) && retry > 0)
          retryAt = Math.max(retryAt, now() + retry * 1_000);
        throw new Error("Quote provider unavailable.");
      }
      const ticks = snapshot.parse(await response.json());
      return symbols.flatMap((symbol) => {
        const result = tick.safeParse(ticks[symbol]);
        if (!result.success || result.data.symbol !== symbol) return [];
        const quote = result.data;
        return [
          {
            symbol,
            price: quote.mid,
            at: new Date(quote.timestamp).toISOString(),
            stale: quote.stale,
            closed: quote.marketState === BIQUOTE_MARKET_CLOSED,
            changePercent: quote.dayDiffPercent ?? undefined,
          },
        ];
      });
    } catch {
      retryAt = Math.max(retryAt, now() + QUOTE_RETRY_MS);
      return null;
    }
  };
}
