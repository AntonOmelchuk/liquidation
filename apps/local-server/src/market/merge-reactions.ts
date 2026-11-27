import {
  CALENDAR_SOURCE,
  CANDLE_INTERVAL,
  FORECAST_RESULT,
} from "@liquidation/domain/market/constants";
import {
  measuredWindows,
  releaseObservationKey,
} from "@liquidation/domain/market/release-history";
import { compareForecast } from "@liquidation/domain/market/release-surprise";
import type {
  MeasuredReaction,
  ReleaseObservation,
} from "@liquidation/domain/market/types";

export function preferMeasuredReaction(
  previous: MeasuredReaction,
  next: MeasuredReaction,
): MeasuredReaction {
  if (previous.interval === next.interval && previous.before === next.before) {
    return {
      ...next,
      closes: [
        next.closes[0] ?? previous.closes[0],
        next.closes[1] ?? previous.closes[1],
      ],
    };
  }
  const difference = measuredWindows(next) - measuredWindows(previous);
  if (difference !== 0) return difference > 0 ? next : previous;
  return next.interval === CANDLE_INTERVAL.MINUTE ? next : previous;
}

function releaseMetadata(
  saved: ReleaseObservation,
  update: ReleaseObservation,
) {
  // Keep the first comparable pair so revised data cannot change its historical category.
  if (compareForecast(saved.event).result !== FORECAST_RESULT.MISSING)
    return saved;
  if (compareForecast(update.event).result !== FORECAST_RESULT.MISSING)
    return update;

  const preferred =
    update.source === CALENDAR_SOURCE.BIQUOTE ||
    saved.source !== CALENDAR_SOURCE.BIQUOTE
      ? update
      : saved;
  const other = preferred === update ? saved : update;
  if (preferred.source !== other.source) return preferred;
  return {
    ...preferred,
    event: {
      ...preferred.event,
      actual: preferred.event.actual || other.event.actual,
      forecast: preferred.event.forecast || other.event.forecast,
      previous: preferred.event.previous || other.event.previous,
    },
  };
}

export function mergeReleaseObservations(
  previous: ReleaseObservation[],
  updates: readonly ReleaseObservation[],
) {
  const records = new Map(
    previous.map((row) => [
      releaseObservationKey(row.event, row.reaction.symbol),
      row,
    ]),
  );
  let changed = false;
  for (const update of updates) {
    const key = releaseObservationKey(update.event, update.reaction.symbol);
    const saved = records.get(key);
    if (!saved) {
      records.set(key, update);
      changed = true;
      continue;
    }
    const merged = {
      ...releaseMetadata(saved, update),
      reaction: preferMeasuredReaction(saved.reaction, update.reaction),
      comparison: saved.comparison || update.comparison,
    };
    if (JSON.stringify(merged) !== JSON.stringify(saved)) {
      records.set(key, merged);
      changed = true;
    }
  }
  return changed ? [...records.values()] : previous;
}
