import { REPORT_ICON_PATHS } from "./constants.ts";
import type { ReviewIconName } from "./types.ts";

export function ReviewIcon({ name }: { name: ReviewIconName }) {
  return (
    <svg
      className="review-icon"
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={REPORT_ICON_PATHS[name]} />
    </svg>
  );
}
