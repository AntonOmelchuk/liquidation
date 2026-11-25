export const PERIOD = {
  DAY: "day",
  WEEK: "week",
  MONTH: "month",
  QUARTER: "quarter",
} as const;
export const PERIODS = Object.values(PERIOD);
export const PREPARATION_PERIODS = [PERIOD.DAY, PERIOD.WEEK] as const;

export const WORKSPACE_RECORD = {
  PREPARATION: "preparation",
  REPORT: "report",
  LEARNING: "learning",
  HIGHLIGHT: "highlight",
  THOUGHT: "thought",
  WATCHLIST: "watchlist",
  MISSED: "missed",
} as const;
export const WATCH_OUTCOME = {
  PENDING: "pending",
  NONE: "none",
  OBSERVED: "observed",
  TRADED: "traded",
  MISSED: "missed",
} as const;
export const WATCH_OUTCOMES = Object.values(WATCH_OUTCOME);
export const WATCHLIST_LIMIT = 32;
export const MISSED_REASON = {
  FEAR: "fear",
  DISTRACTION: "distraction",
  TIMING: "timing",
  HESITATION: "hesitation",
  EXECUTION: "execution",
  OTHER: "other",
} as const;
export const MISSED_REASONS = Object.values(MISSED_REASON);
export const LEARNING_KIND = { LESSON: "lesson", NOTE: "note" } as const;
export const LEARNING_KINDS = Object.values(LEARNING_KIND);
export const LECTURE_BLOCK = { TEXT: "text", IMAGE: "image" } as const;
export const LECTURE_BLOCK_LIMIT = 40;
export const LECTURE_CAPTION_LIMIT = 240;
export const PREPARATION_FIELDS = [
  "outlook",
  "news",
  "alerts",
  "watch",
  "study",
] as const;
export const REPORT_FIELDS = [
  "focus",
  "process",
  "learned",
  "errors",
  "best",
  "overview",
  "missed",
  "lesson",
  "next",
] as const;
export const REPORT_GRADES = ["A", "B", "C", "D", "F"] as const;
export const WORKSPACE_TEXT_LIMIT = 4000;
export const WORKSPACE_TITLE_LIMIT = 120;
export const TASK_TEXT_LIMIT = 240;
export const TASK_LIMIT = 32;
export const ASSESSMENT_LIMIT = 180;
export const RECENT_TRADE_COUNT = 20;
export const WEEK_LENGTH = 7;
export const QUARTER_MONTHS = 3;
