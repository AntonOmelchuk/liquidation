import type { z } from "zod";
import type { FORECAST_RESULT } from "./constants.ts";
import type {
  calendarFeedSchema,
  measuredReactionSchema,
  quoteSchema,
  quoteSnapshotSchema,
  releaseReactionQuerySchema,
  releaseReactionSchema,
  releaseObservationSchema,
} from "./contracts.ts";

export type CalendarFeed = z.infer<typeof calendarFeedSchema>;
export type CalendarEvent = CalendarFeed["events"][number];
export type Quote = z.infer<typeof quoteSchema>;
export type QuoteSnapshot = z.infer<typeof quoteSnapshotSchema>;

export type ReleaseReactionQuery = z.infer<typeof releaseReactionQuerySchema>;
export type ReleaseReaction = z.infer<typeof releaseReactionSchema>;
export type ReactionInterval = NonNullable<ReleaseReaction["interval"]>;
export type MeasuredReaction = z.infer<typeof measuredReactionSchema>;
export type ReleaseObservation = z.infer<typeof releaseObservationSchema>;

export type ReactionWindowSummary = {
  count: number;
  up: number;
  down: number;
  flat: number;
  medianMove: number | null;
  signedMedianMove: number | null;
};

export type ReleaseSeries = {
  key: string;
  event: CalendarEvent;
  symbol: string;
  observations: ReleaseObservation[];
  windows: ReactionWindowSummary[];
};

export type ForecastResult =
  (typeof FORECAST_RESULT)[keyof typeof FORECAST_RESULT];

export type ForecastComparison =
  | {
      result: Exclude<ForecastResult, typeof FORECAST_RESULT.MISSING>;
      difference: number;
      unit: string;
    }
  | { result: typeof FORECAST_RESULT.MISSING };

export type ComparedRelease = {
  observation: ReleaseObservation;
  forecast: ForecastComparison;
};
export type ForecastReactionGroup = {
  result: ForecastResult;
  count: number;
  windows: ReactionWindowSummary[];
};
