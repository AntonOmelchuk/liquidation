import {
  CALENDAR_SOURCE,
  CALENDAR_STATE,
} from "@liquidation/domain/market/constants";
import { expect, it, vi } from "vitest";
import { createCalendarFeed } from "../../../../apps/local-server/src/market/calendar-feed.ts";
import {
  BIQUOTE_CALENDAR_CACHE_MS,
  BIQUOTE_CALENDAR_URL,
  FOREX_FACTORY_EXPORT,
} from "../../../../apps/local-server/src/market/constants.ts";

const schedule = {
  title: "Employment",
  country: "CAD",
  date: "2026-11-24T20:00:00-05:00",
  impact: "High",
  forecast: "10K",
  previous: "12K",
};
const reading = {
  id: "mql5:121",
  name: "Employment",
  currency: "CAD",
  time: "2026-11-25T01:00:00Z",
  timeMode: "exact",
  importance: "high",
  actual: 0,
  forecast: 10,
  previous: null,
  multiplier: "thousands",
};

it("polls actual values from biquote once per cache window and preserves a reported zero", async () => {
  const request = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(
      Response.json([
        reading,
        {
          ...reading,
          id: "mql5:122",
          actual: null,
          timeMode: "tentative",
        },
        {
          ...reading,
          id: "mql5:123",
          name: "Day event",
          time: "2026-11-25T00:30:00+02:00",
          timeMode: "date",
          previous: 12,
        },
        {
          ...reading,
          id: "mql5:124",
          name: "Holiday",
          type: "holiday",
          timeMode: "notime",
        },
      ]),
    )
    .mockResolvedValueOnce(Response.json([{ ...reading, actual: 8 }]));
  let time = Date.parse("2026-11-25T08:00:00Z");
  const read = createCalendarFeed({ request, now: () => time });
  const [first, concurrent] = await Promise.all([read(), read()]);
  expect(concurrent).toEqual(first);
  expect(first).toMatchObject({
    source: CALENDAR_SOURCE.BIQUOTE,
    state: CALENDAR_STATE.READY,
    events: [
      {
        name: "Day event",
        at: "2026-11-24T22:30:00.000Z",
        allDayOn: "2026-11-25",
        timeKnown: false,
        actual: "",
        forecast: "",
        previous: "",
      },
      {
        name: "Employment",
        at: "2026-11-25T01:00:00.000Z",
        actual: "0K",
        forecast: "10K",
        timeKnown: true,
      },
      { actual: "", forecast: "10K", timeKnown: false },
      {
        name: "Holiday",
        allDayOn: "2026-11-25",
        timeKnown: false,
        forecast: "",
      },
    ],
  });
  expect(first.events[2].allDayOn).toBeUndefined();
  const firstUrl = new URL(String(request.mock.calls[0][0]));
  expect(firstUrl.origin + firstUrl.pathname).toBe(BIQUOTE_CALENDAR_URL);
  expect(firstUrl.searchParams.get("from")).toBe("2026-11-24T00:00:00Z");
  expect(firstUrl.searchParams.get("to")).toBe("2026-11-27T00:00:00Z");
  time += BIQUOTE_CALENDAR_CACHE_MS - 1;
  expect(await read()).toEqual(first);
  expect(request).toHaveBeenCalledTimes(1);
  time++;
  expect((await read()).events[0].actual).toBe("8K");
});

it("reuses the cached Forex Factory schedule during an outage and recovers actual values", async () => {
  const request = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(new Response("Rate limited", { status: 429 }))
    .mockResolvedValueOnce(
      Response.json([
        schedule,
        schedule,
        {
          ...schedule,
          title: "Bank holiday",
          impact: "Holiday",
          forecast: null,
        },
        { ...schedule, date: "2026-11-25T12:30:00" },
      ]),
    )
    .mockResolvedValueOnce(new Response("Unavailable", { status: 503 }))
    .mockResolvedValueOnce(Response.json([reading]));
  let time = Date.parse("2026-11-25T08:00:00Z");
  const read = createCalendarFeed({ request, now: () => time });
  const first = await read();
  expect(first).toMatchObject({
    source: CALENDAR_SOURCE.FOREX_FACTORY,
    state: CALENDAR_STATE.READY,
    events: [
      {
        name: "Employment",
        at: "2026-11-25T01:00:00.000Z",
        actual: "",
        timeKnown: true,
      },
      {
        name: "Bank holiday",
        allDayOn: "2026-11-24",
        timeKnown: false,
        forecast: "",
        previous: "",
      },
    ],
  });
  expect(String(request.mock.calls[1][0])).toBe(FOREX_FACTORY_EXPORT);
  time += BIQUOTE_CALENDAR_CACHE_MS;
  expect(await read()).toEqual(first);
  expect(request).toHaveBeenCalledTimes(3);
  time += BIQUOTE_CALENDAR_CACHE_MS;
  expect(await read()).toMatchObject({
    source: CALENDAR_SOURCE.BIQUOTE,
    state: CALENDAR_STATE.READY,
    events: [{ actual: "0K" }],
  });
});

it("keeps the last readings when both calendar sources fail", async () => {
  let time = Date.parse("2026-11-25T10:00:00Z");
  const request = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json([reading]))
    .mockResolvedValueOnce(Response.json([{ unexpected: "schema" }]))
    .mockResolvedValueOnce(new Response("Unavailable", { status: 503 }));
  const read = createCalendarFeed({ request, now: () => time });
  const first = await read();
  time += BIQUOTE_CALENDAR_CACHE_MS;
  expect(await read()).toEqual({ ...first, state: CALENDAR_STATE.STALE });
  await read();
  expect(request).toHaveBeenCalledTimes(3);
});
