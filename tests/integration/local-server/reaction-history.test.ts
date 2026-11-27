import {
  CALENDAR_SOURCE,
  CALENDAR_STATE,
  CANDLE_INTERVAL,
  CHINESE_YUAN,
  EURUSD,
  FORECAST_RESULT,
  MARKET_IMPACT,
  MINUTE_MS,
  OFFSHORE_YUAN_PAIR,
} from "@liquidation/domain/market/constants";
import { quoteSymbolSchema } from "@liquidation/domain/market/contracts";
import { isLegacyYuanReaction } from "@liquidation/domain/market/release-history";
import { compareForecast } from "@liquidation/domain/market/release-surprise";
import type {
  CalendarEvent,
  ReleaseReaction,
  ReleaseReactionQuery,
} from "@liquidation/domain/market/types";
import { tradeRecordInput } from "@liquidation/domain/trades/trade";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it, vi } from "vitest";
import { createJournal } from "../../../apps/local-server/src/journal.ts";
import { createReactionHistory } from "../../../apps/local-server/src/market/reaction-history.ts";

const at = "2026-11-27T13:30:00Z";
const released = Date.parse(at);
const payrolls: CalendarEvent = {
  id: "payrolls",
  name: "Non-Farm Payrolls",
  currency: "USD",
  at,
  timeKnown: true,
  impact: MARKET_IMPACT.HIGH,
  actual: "",
  forecast: "155K",
  previous: "150K",
};
const earnings: CalendarEvent = {
  ...payrolls,
  id: "earnings",
  name: "Average Hourly Earnings m/m",
  impact: MARKET_IMPACT.LOW,
};

it("collects both windows, shares simultaneous candles, retains manual symbols and backs up local history", async () => {
  const directory = await mkdtemp(
    join(tmpdir(), "liquidation-reaction-history-"),
  );
  try {
    await writeFile(
      join(directory, "journal.json"),
      '{"version":1,"trades":[]}',
    );
    const journal = createJournal(directory);
    let now = released + 5 * MINUTE_MS;
    let unavailable = false;
    const readReaction = vi.fn(
      async (query: ReleaseReactionQuery): Promise<ReleaseReaction | null> => {
        if (unavailable) return null;
        const before = query.symbol === "XAUUSD" ? 4100 : 1.08;
        return {
          ...query,
          interval: CANDLE_INTERVAL.MINUTE,
          before,
          closes: [
            before * 1.001,
            now >= released + 15 * MINUTE_MS ? before * 0.998 : null,
          ],
        };
      },
    );
    let events = [
      payrolls,
      earnings,
      { ...payrolls, id: "holiday", name: "Holiday", allDayOn: "2026-11-27" },
      { ...payrolls, id: "tentative", name: "Tentative", timeKnown: false },
      { ...payrolls, id: "old", name: "Too old", at: "2026-11-20T13:30:00Z" },
      { ...payrolls, id: "future", name: "Future", at: "2026-11-28T13:30:00Z" },
    ];
    const options = {
      readCalendar: async () => ({
        source: CALENDAR_SOURCE.BIQUOTE,
        state: CALENDAR_STATE.READY,
        fetchedAt: new Date(now).toISOString(),
        events,
      }),
      readReaction,
      readHistory: journal.readReleaseHistory,
      recordHistory: journal.recordReleaseHistory,
      now: () => now,
    };
    const collector = createReactionHistory(options);
    await Promise.all([collector.collect(), collector.collect()]);
    expect(readReaction).toHaveBeenCalledTimes(1);
    expect(
      (await journal.readReleaseHistory()).map(({ event, reaction }) => [
        event.id,
        reaction.closes[1],
      ]),
    ).toEqual([
      [payrolls.id, null],
      [earnings.id, null],
    ]);
    const selected = { symbol: "XAUUSD", at };
    expect((await collector.read(selected, payrolls.id))?.before).toBe(4100);
    expect(await journal.readReleaseHistory()).toHaveLength(3);

    now = released + 16 * MINUTE_MS;
    events = [{ ...payrolls, actual: "172K" }, ...events.slice(1)];
    await collector.collect();
    expect(readReaction).toHaveBeenCalledTimes(4);
    const saved = await createJournal(directory).readReleaseHistory();
    expect(saved).toHaveLength(3);
    expect(saved.every(({ reaction }) => reaction.closes[1] !== null)).toBe(
      true,
    );
    expect(
      saved
        .filter(({ event }) => event.id === payrolls.id)
        .map(({ event }) => event.actual),
    ).toEqual(["172K", "172K"]);

    unavailable = true;
    const restarted = createReactionHistory(options);
    expect((await restarted.read(selected, payrolls.id))?.closes[1]).toBe(
      4100 * 0.998,
    );
    expect(readReaction).toHaveBeenCalledTimes(4);
    await journal.append(
      tradeRecordInput.parse({
        symbol: "EURUSD",
        direction: "long",
        openedAt: "2026-11-27T13:00:00Z",
        closedAt: "2026-11-27T14:00:00Z",
        profit: 30,
        commission: 0,
        swap: 0,
        risk: 20,
        notes: "",
      }),
    );
    expect(await journal.readReleaseHistory()).toEqual(saved);
    expect(await journal.read()).not.toHaveProperty("releaseObservations");

    const backup = await journal.backup.download();
    const preview = await journal.backup.preview(createReadStream(backup.path));
    await backup.dispose?.();
    expect(preview.summary.newsReactions).toBe(3);
    const extra = {
      ...saved[0],
      reaction: { ...saved[0].reaction, symbol: "GBPUSD" },
    };
    await journal.recordReleaseHistory([extra]);
    const { safetyId } = await journal.backup.restore(preview.token);
    expect(await journal.readReleaseHistory()).toEqual(saved);
    const safety = await journal.backup.safety(safetyId);
    const safetyPreview = await journal.backup.preview(
      createReadStream(safety.path),
    );
    expect(safetyPreview.summary.newsReactions).toBe(4);
    await journal.backup.cancel(safetyPreview.token);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

it("collects CNY on USDCNH, retaining the stored print and keeping older EURUSD comparisons separate", async () => {
  const directory = await mkdtemp(join(tmpdir(), "liquidation-yuan-reaction-"));
  try {
    const journal = createJournal(directory);
    let event = {
      ...payrolls,
      id: "china-cpi",
      name: "CPI y/y",
      currency: CHINESE_YUAN,
      actual: "0.4%",
      forecast: "0.2%",
    };
    await journal.recordReleaseHistory([
      {
        event,
        source: CALENDAR_SOURCE.BIQUOTE,
        reaction: {
          at,
          symbol: EURUSD,
          before: 1.08,
          interval: CANDLE_INTERVAL.MINUTE,
          closes: [1.081, null],
        },
      },
    ]);
    const readReaction = vi.fn(
      async (query: ReleaseReactionQuery): Promise<ReleaseReaction> => {
        const before = query.symbol === OFFSHORE_YUAN_PAIR ? 6.7 : 1.08;
        return {
          ...query,
          before,
          interval: CANDLE_INTERVAL.MINUTE,
          closes: [before + 0.001, before - 0.001],
        };
      },
    );
    const history = createReactionHistory({
      now: () => released + 20 * MINUTE_MS,
      readCalendar: async () => ({
        source: CALENDAR_SOURCE.BIQUOTE,
        state: CALENDAR_STATE.READY,
        fetchedAt: at,
        events: [event],
      }),
      readReaction,
      readHistory: journal.readReleaseHistory,
      recordHistory: journal.recordReleaseHistory,
    });

    await history.collect();
    expect(quoteSymbolSchema.parse(OFFSHORE_YUAN_PAIR)).toBe(
      OFFSHORE_YUAN_PAIR,
    );
    expect(readReaction.mock.calls).toEqual([
      [{ at, symbol: OFFSHORE_YUAN_PAIR }],
    ]);
    const observations = await journal.readReleaseHistory();
    expect(observations.map(({ reaction }) => reaction.symbol)).toEqual([
      EURUSD,
      OFFSHORE_YUAN_PAIR,
    ]);
    expect(observations.map(isLegacyYuanReaction)).toEqual([true, false]);

    event = { ...event, actual: "0.1%" };
    await history.collect();
    const [, offshore] = await journal.readReleaseHistory();
    expect(offshore.event.actual).toBe("0.4%");
    expect(compareForecast(offshore.event).result).toBe(FORECAST_RESULT.ABOVE);

    await history.read({ at, symbol: EURUSD }, event.id);
    const [manual] = await journal.readReleaseHistory();
    expect(manual.comparison).toBe(true);
    expect(isLegacyYuanReaction(manual)).toBe(false);
    expect(manual.reaction.closes[1]).not.toBeNull();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
