import type { ReleaseObservation } from "@liquidation/domain/market/types";

export const EMPTY_RELEASE_HISTORY: readonly ReleaseObservation[] = [];
export const NEWS_COLUMN = {
  NAME: "name",
  COUNT: "count",
  FIVE: "five",
  FIFTEEN: "fifteen",
} as const;
