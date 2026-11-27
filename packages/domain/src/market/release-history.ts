import {
  CHINESE_YUAN,
  EURUSD,
  QUOTE_FX_PAIRS,
  RELEASE_REACTION_MINUTES,
  RELEASE_SYMBOLS,
} from "./constants.ts";
import type {
  CalendarEvent,
  MeasuredReaction,
  ReleaseObservation,
  ReleaseReaction,
  ReleaseReactionQuery,
  ReleaseSeries,
  ReactionWindowSummary,
} from "./types.ts";

export function defaultReactionSymbol(currency: string) {
  return (
    RELEASE_SYMBOLS.get(currency) ??
    QUOTE_FX_PAIRS.find(
      ({ base, quote }) => base === currency || quote === currency,
    )?.symbol
  );
}

export function isLegacyYuanReaction({
  event,
  reaction,
  comparison,
}: ReleaseObservation) {
  return (
    !comparison && event.currency === CHINESE_YUAN && reaction.symbol === EURUSD
  );
}

export function normalizeReleaseName(name: string) {
  return name.normalize("NFKC").trim().replace(/\s+/gu, " ").toLowerCase();
}

export function measurementKey({ at, symbol }: ReleaseReactionQuery) {
  return JSON.stringify([Date.parse(at), symbol]);
}

export function releaseSeriesKey(event: CalendarEvent, symbol: string) {
  return JSON.stringify([
    event.currency,
    normalizeReleaseName(event.name),
    symbol,
  ]);
}

export function releaseObservationKey(event: CalendarEvent, symbol: string) {
  return JSON.stringify([
    releaseSeriesKey(event, symbol),
    Date.parse(event.at),
  ]);
}

export function releaseOccurrenceKey(event: CalendarEvent) {
  return JSON.stringify([
    event.currency,
    normalizeReleaseName(event.name),
    Date.parse(event.at),
  ]);
}

export function measuredWindows(reaction?: ReleaseReaction | null) {
  return reaction?.closes.filter((close) => close !== null).length ?? 0;
}

export function isMeasuredReaction(
  reaction: ReleaseReaction | null,
): reaction is MeasuredReaction {
  return Boolean(
    reaction &&
    reaction.before !== null &&
    reaction.interval &&
    measuredWindows(reaction),
  );
}

function median(values: number[]) {
  if (!values.length) return null;
  values.sort((a, b) => a - b);
  const middle = Math.floor(values.length / 2);
  return values.length % 2
    ? values[middle]
    : (values[middle - 1] + values[middle]) / 2;
}

function summarizeWindow(
  observations: readonly ReleaseObservation[],
  index: number,
): ReactionWindowSummary {
  let up = 0;
  let down = 0;
  let flat = 0;
  const moves: number[] = [];
  for (const { reaction } of observations) {
    const close = reaction.closes[index];
    if (close == null) continue;
    const move = (close - reaction.before) / reaction.before;
    if (!Number.isFinite(move)) continue;
    if (move > 0) up += 1;
    else if (move < 0) down += 1;
    else flat += 1;
    moves.push(move);
  }
  return {
    count: moves.length,
    up,
    down,
    flat,
    medianMove: median(moves.map(Math.abs)),
    signedMedianMove: median(moves),
  };
}

export function summarizeReactionWindows(
  observations: readonly ReleaseObservation[],
) {
  return RELEASE_REACTION_MINUTES.map((_, index) =>
    summarizeWindow(observations, index),
  );
}

export function buildReleaseSeries(
  rows: readonly ReleaseObservation[],
): ReleaseSeries[] {
  const groups = Map.groupBy(rows, ({ event, reaction }) =>
    releaseSeriesKey(event, reaction.symbol),
  );
  return Array.from(groups, ([key, observations]) => {
    observations.sort(
      (left, right) => Date.parse(right.event.at) - Date.parse(left.event.at),
    );
    const { event, reaction } = observations[0];
    return {
      key,
      event,
      symbol: reaction.symbol,
      observations,
      windows: summarizeReactionWindows(observations),
    };
  });
}
