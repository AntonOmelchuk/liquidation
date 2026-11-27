import {
  MINUTE_MS,
  RELEASE_REACTION_MINUTES,
} from "@liquidation/domain/market/constants";
import {
  defaultReactionSymbol,
  isLegacyYuanReaction,
  isMeasuredReaction,
  measuredWindows,
  measurementKey,
  releaseObservationKey,
  releaseOccurrenceKey,
} from "@liquidation/domain/market/release-history";
import type {
  CalendarEvent,
  MeasuredReaction,
  ReleaseObservation,
  ReleaseReactionQuery,
} from "@liquidation/domain/market/types";
import {
  REACTION_COLLECTION_BATCH,
  REACTION_COLLECTION_INTERVAL_MS,
  REACTION_COLLECTION_LOOKBACK_MS,
  REACTION_COLLECTION_RETRY_MS,
} from "./constants.ts";
import { preferMeasuredReaction } from "./merge-reactions.ts";
import type {
  ReactionCollectionGroup,
  ReactionHistoryOptions,
} from "./types.ts";

function timed(event: CalendarEvent) {
  return event.timeKnown && !event.allDayOn;
}

function collectionGroups(
  events: readonly CalendarEvent[],
  saved: readonly ReleaseObservation[],
) {
  const groups = new Map<string, ReactionCollectionGroup>();
  const priorByEvent = Map.groupBy(
    saved.filter((row) => !isLegacyYuanReaction(row)),
    ({ event }) => releaseOccurrenceKey(event),
  );
  for (const event of events) {
    const symbols = new Set<string>();
    const defaultSymbol = defaultReactionSymbol(event.currency);
    if (defaultSymbol) symbols.add(defaultSymbol);
    for (const row of priorByEvent.get(releaseOccurrenceKey(event)) ?? [])
      symbols.add(row.reaction.symbol);
    for (const symbol of symbols) {
      const query = { at: event.at, symbol };
      const key = measurementKey(query);
      const group = groups.get(key);
      if (group) group.events.push(event);
      else groups.set(key, { query, events: [event] });
    }
  }
  return groups;
}

export function createReactionHistory({
  readCalendar,
  readReaction,
  readHistory,
  recordHistory,
  now = Date.now,
}: ReactionHistoryOptions) {
  const attempted = new Map<string, number>();
  let collecting: Promise<void> | undefined;

  async function latest(query: ReleaseReactionQuery, saved?: MeasuredReaction) {
    if (saved && measuredWindows(saved) === RELEASE_REACTION_MINUTES.length)
      return saved;
    const fresh = await readReaction(query);
    if (!saved) return fresh;
    return isMeasuredReaction(fresh)
      ? preferMeasuredReaction(saved, fresh)
      : saved;
  }

  async function read(query: ReleaseReactionQuery, eventId: string | null) {
    if (!eventId) return readReaction(query);
    const [feed, history] = await Promise.all([readCalendar(), readHistory()]);
    const release = Date.parse(query.at);
    const event = feed.events.find(
      (entry) =>
        entry.id === eventId &&
        timed(entry) &&
        Date.parse(entry.at) === release,
    );
    const key = event ? releaseObservationKey(event, query.symbol) : undefined;
    const sampleKey = measurementKey(query);
    const saved = history.find((row) =>
      key
        ? releaseObservationKey(row.event, row.reaction.symbol) === key
        : row.event.id === eventId &&
          measurementKey(row.reaction) === sampleKey,
    );
    const result = await latest(query, saved?.reaction);
    if (event && isMeasuredReaction(result))
      await recordHistory([
        {
          event,
          source: feed.source,
          reaction: result,
          ...(query.symbol === defaultReactionSymbol(event.currency)
            ? {}
            : { comparison: true as const }),
        },
      ]);
    return result;
  }

  async function sweep(signal?: AbortSignal) {
    const time = now();
    const feed = await readCalendar();
    const events = feed.events.filter((event) => {
      const elapsed = time - Date.parse(event.at);
      return (
        timed(event) &&
        elapsed >= RELEASE_REACTION_MINUTES[0] * MINUTE_MS &&
        elapsed <= REACTION_COLLECTION_LOOKBACK_MS
      );
    });
    if (signal?.aborted) return;
    if (!events.length) {
      attempted.clear();
      return;
    }
    const history = (await readHistory()).filter(
      ({ event }) =>
        time - Date.parse(event.at) <= REACTION_COLLECTION_LOOKBACK_MS,
    );
    const groups = collectionGroups(events, history);
    for (const key of attempted.keys())
      if (!groups.has(key)) attempted.delete(key);
    const savedByMeasurement = new Map<string, MeasuredReaction>();
    for (const { reaction } of history) {
      const key = measurementKey(reaction);
      if (!groups.has(key)) continue;
      const saved = savedByMeasurement.get(key);
      savedByMeasurement.set(
        key,
        saved ? preferMeasuredReaction(saved, reaction) : reaction,
      );
    }

    const pending = [...groups]
      .filter(([key, { query }]) => {
        const elapsed = time - Date.parse(query.at);
        const expected = RELEASE_REACTION_MINUTES.filter(
          (minutes) => elapsed >= minutes * MINUTE_MS,
        ).length;
        const last = attempted.get(key);
        return (
          measuredWindows(savedByMeasurement.get(key)) < expected &&
          (last === undefined || time - last >= REACTION_COLLECTION_RETRY_MS)
        );
      })
      .sort(
        ([left], [right]) =>
          (attempted.get(left) ?? 0) - (attempted.get(right) ?? 0),
      )
      .slice(0, REACTION_COLLECTION_BATCH);
    // Releases at the same time on the same instrument reuse the same candles.
    await Promise.allSettled(
      pending.map(async ([key, { query }]) => {
        attempted.set(key, time);
        const reaction = await latest(query, savedByMeasurement.get(key));
        if (isMeasuredReaction(reaction)) savedByMeasurement.set(key, reaction);
      }),
    );

    const updates: ReleaseObservation[] = [];
    for (const [key, { events }] of groups) {
      const reaction = savedByMeasurement.get(key);
      if (reaction)
        for (const event of events)
          updates.push({ event, source: feed.source, reaction });
    }
    if (updates.length && !signal?.aborted) await recordHistory(updates);
  }

  function collect(signal?: AbortSignal) {
    if (signal?.aborted) return Promise.resolve();
    collecting ??= sweep(signal).finally(() => {
      collecting = undefined;
    });
    return collecting;
  }

  return { read, collect };
}

export function startReactionCollection(
  collect: (signal: AbortSignal) => Promise<void>,
) {
  const stop = new AbortController();
  function tick() {
    void collect(stop.signal).catch((error) =>
      console.error("Could not collect news reactions.", error),
    );
  }
  tick();
  const timer = setInterval(tick, REACTION_COLLECTION_INTERVAL_MS).unref();
  return () => {
    stop.abort();
    clearInterval(timer);
  };
}
