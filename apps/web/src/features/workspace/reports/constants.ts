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
