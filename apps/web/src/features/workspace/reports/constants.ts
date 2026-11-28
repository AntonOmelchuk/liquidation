export const REPORT_LESSON_FIELD = "lesson";
export const PRIMARY_REPORT_FIELDS = [
  "focus",
  "process",
  "learned",
  "errors",
] as const;
export const EXTRA_REPORT_FIELDS = [
  "missed",
  REPORT_LESSON_FIELD,
  "next",
] as const;
export const GRADE_MAX = 20;
export const ASSESSMENT_NOTE_MAX = 1000;
export const ENTRY_CHECKLIST = "entry";
export const REPORT_ROW_STEP = 20;

export const REPORT_ICON_PATHS = {
  focus: "M19 12a7 7 0 1 1-7-7m0-3v4m10 6h-4m-6 10v-4M2 12h4m6 0 7-7m-4 0h4v4",
  process: "M3 12h4l3-7 4 14 3-7h4",
  learned:
    "M3 5h6a3 3 0 0 1 3 3v12a3 3 0 0 0-3-3H3V5Zm18 0h-6a3 3 0 0 0-3 3v12a3 3 0 0 1 3-3h6V5Z",
  errors:
    "M12 8v5m0 3v.1M10.3 4.5 3 17.3c-.6 1.1.2 2.4 1.4 2.4h15.2c1.2 0 2-1.3 1.4-2.4L13.7 4.5a2 2 0 0 0-3.4 0Z",
  best: "m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z",
  overview: "M7 3h8l4 4v14H5V3h2m8 0v5h4M8 12h8m-8 4h8",
  missed: "M12 8v4l3 2m3.4 4.4A9 9 0 1 1 21 12m-1 4v5m-2.5-2.5h5",
  lesson:
    "M9 18h6m-5 3h4m-2-18a6 6 0 0 0-4 10c1 .9 1.5 2 1.5 3h5c0-1 .5-2.1 1.5-3a6 6 0 0 0-4-10Z",
  next: "M4 12h15m-6-6 6 6-6 6",
  grade: "M7 4h10v12l-5 4-5-4V4Zm2.5 7 1.5 1.5 3.5-3.5",
  quality: "m12 3 8 9-8 9-8-9 8-9Zm-3 9 2 2 4-4",
  progress: "M4 20h16M6 16v-4m6 4V8m6 8V4",
  pnl: "M4 18V6m0 12h16M7 14l4-4 3 2 5-6m-4 0h4v4",
  screenshots: "M4 5h16v14H4V5Zm0 11 4-4 4 4 3-3 5 4M15 9h.1",
  positions: "M4 7h16v13H4V7Zm4 0V4h8v3M4 12h16m-10 0v2h4v-2",
} as const;

export const REPORT_NOTE_ACCENTS = {
  focus: "violet",
  process: "blue",
  learned: "green",
  errors: "red",
  best: "amber",
  overview: "violet",
  missed: "amber",
  lesson: "blue",
  next: "green",
} as const;
