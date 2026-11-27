import {
  FORECAST_RESULT,
  FORECAST_RESULTS,
  PERCENT_READING_UNIT,
  READING_SCALE,
} from "./constants.ts";
import { summarizeReactionWindows } from "./release-history.ts";
import type {
  CalendarEvent,
  ComparedRelease,
  ForecastComparison,
  ForecastReactionGroup,
  ReleaseObservation,
} from "./types.ts";

const readingPattern =
  /^([+-]?(?:(?:\d{1,3}(?:,\d{3})+|\d{1,3}(?: \d{3})+|\d+)(?:\.\d+)?|\.\d+))(?:e([+-]?\d+))?\s*([KMBT%])?$/iu;

function parseReading(reading: string) {
  const match = readingPattern.exec(
    reading.normalize("NFKC").trim().replaceAll("−", "-"),
  );
  if (!match) return null;
  const [, digits, exponent, suffix] = match;
  return {
    digits: digits.replaceAll(/[ ,]/g, ""),
    exponent: Number(exponent ?? 0),
    unit: suffix?.toUpperCase() ?? "",
  };
}

export function compareForecast({
  actual,
  forecast,
}: Pick<CalendarEvent, "actual" | "forecast">): ForecastComparison {
  const published = parseReading(actual);
  const expected = parseReading(forecast);
  if (
    !published ||
    !expected ||
    (published.unit === PERCENT_READING_UNIT) !==
      (expected.unit === PERCENT_READING_UNIT)
  )
    return { result: FORECAST_RESULT.MISSING };

  // Use the reported unit when both values share a scale.
  const sameUnit = published.unit === expected.unit;
  const actualScale = sameUnit ? 0 : (READING_SCALE.get(published.unit) ?? 0);
  const forecastScale = sameUnit ? 0 : (READING_SCALE.get(expected.unit) ?? 0);
  const value = Number(
    published.digits + "e" + (published.exponent + actualScale),
  );
  const consensus = Number(
    expected.digits + "e" + (expected.exponent + forecastScale),
  );
  const difference = value - consensus;
  if (!Number.isFinite(difference)) return { result: FORECAST_RESULT.MISSING };
  return {
    result:
      difference > 0
        ? FORECAST_RESULT.ABOVE
        : difference < 0
          ? FORECAST_RESULT.BELOW
          : FORECAST_RESULT.INLINE,
    difference,
    unit: sameUnit ? published.unit : "",
  };
}

export function compareReleaseObservations(
  observations: readonly ReleaseObservation[],
): ComparedRelease[] {
  return observations.map((observation) => ({
    observation,
    forecast: compareForecast(observation.event),
  }));
}

export function summarizeForecastReactions(
  releases: readonly ComparedRelease[],
): ForecastReactionGroup[] {
  const byResult = Map.groupBy(releases, ({ forecast }) => forecast.result);
  return FORECAST_RESULTS.flatMap((result) => {
    const observations =
      byResult.get(result)?.map(({ observation }) => observation) ?? [];
    if (result === FORECAST_RESULT.MISSING && !observations.length) return [];
    return [
      {
        result,
        count: observations.length,
        windows: summarizeReactionWindows(observations),
      },
    ];
  });
}
