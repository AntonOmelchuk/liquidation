import type {
  MistakePeriodRow,
  MistakeRow,
} from "@liquidation/domain/analytics/types";
import type { TradeLinks } from "@liquidation/domain/trades/types";
import type { MISTAKE_COLUMN, MISTAKE_PERIOD_COLUMN } from "./constants.ts";

export type MistakeReviewFieldsProps = {
  initial?: TradeLinks;
  disabled?: boolean;
};
export type MistakeColumn =
  (typeof MISTAKE_COLUMN)[keyof typeof MISTAKE_COLUMN];
export type MistakePeriodColumn =
  (typeof MISTAKE_PERIOD_COLUMN)[keyof typeof MISTAKE_PERIOD_COLUMN];
export type MistakeSummaryProps = {
  rows: readonly MistakeRow[];
  focus?: string;
  onFocus: (key: string | undefined) => void;
};
export type MistakePeriodTableProps = {
  rows: readonly MistakePeriodRow[];
  title: string;
  heading: string;
  label: (key: string) => string;
  chronological?: boolean;
};
