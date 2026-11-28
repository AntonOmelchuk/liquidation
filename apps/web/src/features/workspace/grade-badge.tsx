import { REPORT_GRADES } from "@liquidation/domain/workspace/constants";
import "./grade-badge.css";

const [highest, good, fair, low, failing] = REPORT_GRADES;

const gradeTones = {
  [highest]: "positive",
  [good]: "positive",
  [fair]: "caution",
  [low]: "negative",
  [failing]: "negative",
};

export function GradeBadge({ value }: { value: string }) {
  const grade = REPORT_GRADES.find((item) => item === value.toUpperCase());
  return (
    <span className="review-grade" data-tone={grade && gradeTones[grade]}>
      {value}
    </span>
  );
}
