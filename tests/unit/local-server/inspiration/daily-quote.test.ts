import { expect, it, vi } from "vitest";
import { DAILY_QUOTE_URL } from "../../../../apps/local-server/src/inspiration/constants.ts";
import { createDailyQuoteReader } from "../../../../apps/local-server/src/inspiration/daily-quote.ts";

it("shares one request per local day and returns plain text with attribution", async () => {
  let now = new Date(2026, 10, 27, 15).getTime();
  const request = vi.fn(async () =>
    Response.json([
      { q: "A clear decision.", a: "Example author", h: "<b>Unused</b>" },
    ]),
  );
  const read = createDailyQuoteReader(request, () => now);
  const replies = await Promise.all([read(), read(), read()]);
  expect(replies).toEqual(
    Array(3).fill({ text: "A clear decision.", author: "Example author" }),
  );
  expect(request).toHaveBeenCalledOnce();
  expect(request).toHaveBeenCalledWith(
    DAILY_QUOTE_URL,
    expect.objectContaining({ redirect: "error" }),
  );

  now = new Date(2026, 10, 28, 15).getTime();
  await read();
  expect(request).toHaveBeenCalledTimes(2);
});

it("makes a provider error or invalid reply available to the local fallback", async () => {
  let now = new Date(2026, 10, 27, 15).getTime();
  const request = vi
    .fn()
    .mockResolvedValueOnce(new Response(null, { status: 503 }))
    .mockResolvedValueOnce(Response.json([{ a: "No quote" }]));
  const read = createDailyQuoteReader(request, () => now);
  expect(await read()).toBeNull();
  expect(await read()).toBeNull();
  expect(request).toHaveBeenCalledOnce();

  now = new Date(2026, 10, 28, 15).getTime();
  expect(await read()).toBeNull();
  expect(request).toHaveBeenCalledTimes(2);
});
