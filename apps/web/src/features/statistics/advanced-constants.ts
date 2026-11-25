import { R_BUCKET } from "@liquidation/domain/analytics/constants";

export const R_BUCKET_LABELS = {
  [R_BUCKET.BELOW_MINUS_TWO]: "≤ −2R",
  [R_BUCKET.MINUS_TWO_TO_MINUS_ONE]: "−2R < R ≤ −1R",
  [R_BUCKET.MINUS_ONE_TO_ZERO]: "−1R < R < 0",
  [R_BUCKET.ZERO]: "0R",
  [R_BUCKET.ZERO_TO_ONE]: "0 < R ≤ 1R",
  [R_BUCKET.ONE_TO_TWO]: "1R < R ≤ 2R",
  [R_BUCKET.ABOVE_TWO]: "> 2R",
} as const;
export const PRICE_METRIC_KEYS = [
  "plannedRR",
  "grossR",
  "mfe",
  "mae",
  "givebackR",
] as const;

export const BE_GROUP = { MOVED: "moved", NOT_MOVED: "notMoved" } as const;
