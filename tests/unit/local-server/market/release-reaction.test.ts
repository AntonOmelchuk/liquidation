import { expect, it, vi } from "vitest";
import { createReleaseReactionReader } from "../../../../apps/local-server/src/market/release-reaction.ts";
import { REACTION_RETRY_MS } from "../../../../apps/local-server/src/market/constants.ts";

const release = { symbol: "EURUSD", at: "2026-11-25T13:30:00.000Z" };
const candle = (openTime: string, close: number, isOpen = false) => ({
  openTime: "2026-11-25T" + openTime + ":00Z",
  close,
  isOpen,
});
const response = (interval: string, bars: ReturnType<typeof candle>[]) =>
  Response.json({ symbol: release.symbol, interval, bars });

it("waits for completed windows and compares the exact candle closes", async () => {
  let time = Date.parse("2026-11-25T13:34:59Z");
  const request = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(
      response("1m", [
        candle("13:29", 1.08),
        candle("13:34", 1.081),
        candle("13:44", 1.075, true),
      ]),
    )
    .mockResolvedValueOnce(
      response("1m", [
        candle("13:44", 1.079),
        candle("13:29", 1.08),
        candle("13:45", 1.075, true),
        candle("13:34", 1.081),
        candle("13:33", 1.09),
      ]),
    );
  const read = createReleaseReactionReader({ request, now: () => time });
  expect(await read(release)).toMatchObject({
    before: null,
    closes: [null, null],
  });
  expect(request).not.toHaveBeenCalled();
  time += 1_000;
  const [first, second] = await Promise.all([read(release), read(release)]);
  expect(first).toEqual(second);
  expect(first).toMatchObject({ before: 1.08, closes: [1.081, null] });
  expect(request).toHaveBeenCalledTimes(1);
  const url = new URL(String(request.mock.calls[0][0]));
  expect(url.pathname).toBe("/api/EURUSD/ohlc");
  expect(url.searchParams.get("interval")).toBe("1m");
  expect(url.searchParams.get("to")).toBe("2026-11-25T13:35:00.000Z");

  time = Date.parse("2026-11-25T13:45:02Z");
  const settled = await read(release);
  expect(settled).toEqual({
    ...release,
    interval: "1m",
    before: 1.08,
    closes: [1.081, 1.079],
  });
  time += REACTION_RETRY_MS;
  expect(await read(release)).toEqual(settled);
  expect(request).toHaveBeenCalledTimes(2);
});

it("falls back to complete five-minute candles for a scheduled five-minute boundary", async () => {
  const request = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(response("1m", []))
    .mockResolvedValueOnce(
      response("5m", [
        candle("13:25", 1.08),
        candle("13:30", 1.081),
        candle("13:40", 1.079),
      ]),
    );
  const read = createReleaseReactionReader({
    request,
    now: () => Date.parse("2026-11-25T19:30:00Z"),
  });
  expect(await read(release)).toEqual({
    ...release,
    interval: "5m",
    before: 1.08,
    closes: [1.081, 1.079],
  });
  expect(
    new URL(String(request.mock.calls[1][0])).searchParams.get("interval"),
  ).toBe("5m");
});

it("keeps gaps empty and avoids using a coarser candle that would span the release", async () => {
  const request = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(
      response("1m", [
        candle("13:30", 1.08),
        candle("13:35", 1.081, true),
        candle("13:36", 1.09),
      ]),
    );
  const read = createReleaseReactionReader({
    request,
    now: () => Date.parse("2026-11-25T13:47:00Z"),
  });
  const at = "2026-11-25T13:31:00.000Z";
  expect(await read({ ...release, at })).toMatchObject({
    before: 1.08,
    closes: [null, null],
  });
  expect(request).toHaveBeenCalledTimes(1);
});
