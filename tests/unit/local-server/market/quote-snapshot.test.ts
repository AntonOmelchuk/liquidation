import { expect, it, vi } from "vitest";
import {
  BIQUOTE_QUOTES_URL,
  QUOTE_RETRY_MS,
} from "../../../../apps/local-server/src/market/constants.ts";
import { createQuoteReader } from "../../../../apps/local-server/src/market/quote-snapshot.ts";

const tick = {
  symbol: "EURUSD",
  mid: 1.09442,
  bid: 1.09439,
  ask: 1.09445,
  timestamp: "2026-11-25T10:16:09Z",
  dayDiffPercent: 0.3337,
  marketState: "open",
  stale: false,
};

it("fetches the selected symbols in one request and preserves source freshness", async () => {
  const request = vi.fn<typeof fetch>().mockResolvedValue(
    Response.json({
      EURUSD: tick,
      GBPUSD: {
        ...tick,
        symbol: "GBPUSD",
        mid: 1.3,
        marketState: "closed",
        stale: true,
        dayDiffPercent: null,
      },
      USDJPY: { ...tick, symbol: "USDJPY", mid: 0 },
      XAUUSD: { ...tick, symbol: "XAUUSD" },
    }),
  );
  const read = createQuoteReader({ request });
  expect(await read(["GBPUSD", "EURUSD", "USDJPY"])).toEqual([
    {
      symbol: "GBPUSD",
      price: 1.3,
      at: "2026-11-25T10:16:09.000Z",
      stale: true,
      closed: true,
      changePercent: undefined,
    },
    {
      symbol: "EURUSD",
      price: 1.09442,
      at: "2026-11-25T10:16:09.000Z",
      stale: false,
      closed: false,
      changePercent: 0.3337,
    },
  ]);
  expect(request).toHaveBeenCalledTimes(1);
  const url = new URL(String(request.mock.calls[0][0]));
  expect(url.origin + url.pathname).toBe(BIQUOTE_QUOTES_URL);
  expect(url.searchParams.getAll("symbols")).toEqual([
    "GBPUSD",
    "EURUSD",
    "USDJPY",
  ]);
});

it("respects the upstream Retry-After before trying another snapshot", async () => {
  let time = Date.parse("2026-11-25T10:00:00Z");
  const retry = QUOTE_RETRY_MS * 2;
  const request = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(
      new Response("Rate limited", {
        status: 429,
        headers: { "Retry-After": String(retry / 1_000) },
      }),
    )
    .mockResolvedValueOnce(Response.json({ EURUSD: tick }));
  const read = createQuoteReader({ request, now: () => time });
  expect(await read(["EURUSD"])).toBeNull();
  time += retry - 1;
  expect(await read(["EURUSD"])).toBeNull();
  expect(request).toHaveBeenCalledTimes(1);
  time++;
  expect(await read(["EURUSD"])).toMatchObject([{ price: tick.mid }]);
});
