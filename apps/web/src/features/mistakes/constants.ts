export const ADD_MISTAKE_KEY = "Enter";

export const MISTAKE_COLUMN = {
  LABEL: "label",
  COUNT: "count",
  CRITICAL: "criticalCount",
  RATE: "rate",
  NET: "net",
  LOSSES: "losses",
  PREVIOUS: "previous",
  RECENT: "recent",
  TREND: "trend",
} as const;

export const MISTAKE_PERIOD_COLUMN = {
  GROUP: "key",
  CLOSED: "closed",
  REVIEWED: "reviewed",
  AFFECTED: "affected",
  OCCURRENCES: "occurrences",
  CRITICAL: "criticalOccurrences",
  RATE: "rate",
} as const;
