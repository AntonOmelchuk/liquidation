import type { reportIndex } from "@liquidation/domain/workspace/report-index";
import type { Position, Trade } from "@liquidation/domain/trades/types";
import type { REPORT_FIELDS } from "@liquidation/domain/workspace/constants";
import type { Report, ReviewPeriod } from "@liquidation/domain/workspace/types";
import type { ReactNode } from "react";

export type ReportPageProps = {
  period?: ReviewPeriod;
  day?: string;
  recent?: boolean;
};
export type ComparisonProps = {
  current: readonly Trade[];
  previous: readonly Trade[];
  currentLabel: string;
  previousLabel: string;
  showChange: boolean;
};
export type ReviewSubject = Position | Trade;
export type ReportTextField = (typeof REPORT_FIELDS)[number];
export type ReportFormProps = {
  report?: Report;
  period: ReviewPeriod;
  start: string;
  candidates: ReviewSubject[];
  dateField: ReactNode;
  dateLinks: ReactNode;
  net: number;
  tradeCount: number;
  onClose: (saved?: boolean) => void;
};
export type AssessmentFieldsProps = {
  candidates: ReviewSubject[];
  grades: Report["assessments"];
  onChange: (grades: Report["assessments"]) => void;
};
export type CardPageProps = { day?: string };
export type ReportIndexRowProps = {
  row: ReturnType<typeof reportIndex>[number]["quarter"];
};

export type PeriodInsightsProps = {
  trades: readonly Trade[];
  period: ReviewPeriod;
  start: string;
};
