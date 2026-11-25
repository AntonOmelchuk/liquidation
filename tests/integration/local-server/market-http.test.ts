import {
  CALENDAR_SOURCE,
  CALENDAR_STATE,
  MARKET_ROUTES,
} from "@liquidation/domain/market/constants";
import { once } from "node:events";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { expect, it, vi } from "vitest";
import { localApiHandler } from "../../../apps/local-server/src/http/local-api.ts";
import {
  BIQUOTE_CALENDAR_URL,
  BIQUOTE_QUOTES_URL,
} from "../../../apps/local-server/src/market/constants.ts";

it("serves the market panels and release reaction through the loopback-only API without keys", async () => {
  const request = globalThis.fetch;
  const upstream = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation((url, options) => {
      if (String(url).startsWith(BIQUOTE_CALENDAR_URL + "?"))
        return Promise.resolve(Response.json([]));
      if (new URL(String(url)).pathname === "/api/EURUSD/ohlc")
        return Promise.resolve(
          Response.json({
            symbol: "EURUSD",
            interval: "1m",
            bars: [
              { openTime: "2026-11-24T08:14:00Z", close: 1.085, isOpen: false },
              { openTime: "2026-11-24T08:19:00Z", close: 1.086, isOpen: false },
              { openTime: "2026-11-24T08:29:00Z", close: 1.084, isOpen: false },
            ],
          }),
        );
      if (String(url).startsWith(BIQUOTE_QUOTES_URL + "?")) {
        const symbols = new URL(String(url)).searchParams.getAll("symbols");
        return Promise.resolve(
          Response.json(
            Object.fromEntries(
              symbols.map((symbol) => [
                symbol,
                {
                  symbol,
                  mid: 1.25,
                  timestamp: "2026-11-25T10:00:00Z",
                  marketState: "open",
                  stale: false,
                },
              ]),
            ),
          ),
        );
      }
      return request(url, options);
    });
  const handle = localApiHandler();
  const server = createServer((request, response) => {
    if (!handle(request, response)) response.writeHead(404).end();
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = "http://127.0.0.1:" + (server.address() as AddressInfo).port;
  try {
    const calendar = await request(base + MARKET_ROUTES.calendar);
    expect(await calendar.json()).toMatchObject({
      source: CALENDAR_SOURCE.BIQUOTE,
      state: CALENDAR_STATE.READY,
      events: [],
    });

    const quotes = await request(
      base + MARKET_ROUTES.quotes + "?symbols=EURUSD,GBPUSD",
    );
    expect(quotes.status).toBe(200);
    expect(await quotes.json()).toMatchObject([
      { symbol: "EURUSD", price: 1.25 },
      { symbol: "GBPUSD", price: 1.25 },
    ]);

    const at = new URLSearchParams({
      symbol: "EURUSD",
      at: "2026-11-24T08:15:00Z",
    });
    const marketMove = await request(base + MARKET_ROUTES.reaction + "?" + at);
    expect(marketMove.status).toBe(200);
    expect(await marketMove.json()).toMatchObject({
      before: 1.085,
      closes: [1.086, 1.084],
    });

    const rejected = await request(
      base + MARKET_ROUTES.reaction + "?symbol=UNKNOWN&at=not-a-date",
    );
    expect(rejected.status).toBe(422);
    const invalid = await request(
      base + MARKET_ROUTES.quotes + "?symbols=EURUSD,EURUSD",
    );
    expect(invalid.status).toBe(422);
    const crossSite = await request(base + MARKET_ROUTES.calendar, {
      headers: { "Sec-Fetch-Site": "cross-site" },
    });
    expect(crossSite.status).toBe(403);
    expect(upstream).toHaveBeenCalledTimes(3);
  } finally {
    upstream.mockRestore();
    server.close();
    await once(server, "close");
  }
});
