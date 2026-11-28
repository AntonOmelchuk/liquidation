import { dailyQuoteSchema } from "@liquidation/domain/inspiration/contracts";
import { localDay } from "@liquidation/domain/workspace/period";
import { z } from "zod";
import { DAILY_QUOTE_TIMEOUT_MS, DAILY_QUOTE_URL } from "./constants.ts";

const providerQuote = z.tuple([
  z.object({
    q: dailyQuoteSchema.shape.text,
    a: dailyQuoteSchema.shape.author,
  }),
]);

export function createDailyQuoteReader(request = fetch, now = Date.now) {
  let cached: { day: string; quote: ReturnType<typeof load> } | undefined;

  async function load() {
    try {
      const response = await request(DAILY_QUOTE_URL, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(DAILY_QUOTE_TIMEOUT_MS),
        redirect: "error",
      });
      if (!response.ok) return null;
      const [{ q, a }] = providerQuote.parse(await response.json());
      return { text: q, author: a };
    } catch {
      return null;
    }
  }

  return function read() {
    const day = localDay(new Date(now()).toISOString());
    if (cached?.day !== day) cached = { day, quote: load() };
    return cached.quote;
  };
}
