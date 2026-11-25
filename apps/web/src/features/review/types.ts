import type {
  ReviewGroup,
  ReviewReport,
  ReviewRule,
  ReviewSimulation,
} from "@liquidation/domain/review/types";
import type { useLocale } from "../../shared/messages.ts";
import type { useReviewMessages } from "./messages.ts";

export type ReviewMessages = ReturnType<typeof useReviewMessages>;
export type ReviewTable = {
  label: string;
  columns: readonly string[];
  rows: { key: string; cells: readonly string[] }[];
};
export type ReportTables = {
  metrics: ReviewTable;
  accounts: ReviewTable;
  groups: Record<ReviewGroup, ReviewTable>;
};
export type ReviewPresentation = ReturnType<typeof useLocale> & {
  messages: ReviewMessages;
};
export type ReviewSuggestion = { key: string; label: string; rule: ReviewRule };
export type ReviewSimulatorProps = {
  report: ReviewReport;
  suggestions: readonly ReviewSuggestion[];
  rule: ReviewRule | null;
  onRule: (rule: ReviewRule) => void;
  result: ReviewSimulation | null;
};
export type RuleFormProps = {
  symbols: readonly string[];
  onApply: (rule: ReviewRule) => void;
};
export type ReviewWorkspaceProps = { report: ReviewReport };
export type ReviewOverviewProps = {
  report: ReviewReport;
  tables: ReportTables;
};

export type ReviewDownload = {
  report: ReviewReport;
  tables: ReportTables;
  findings: readonly { title: string; summary: string; hypothesis?: string }[];
  questions: readonly ReviewSuggestion[];
  comparison?: { table: ReviewTable; label: string };
};
