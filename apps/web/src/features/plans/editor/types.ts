import type {
  Plan,
  PlanAnalysisBlock,
  PlanSetup,
  PlanTradeChange,
} from "@liquidation/domain/plans/types";
import type { PlaybookReference } from "@liquidation/domain/playbooks/types";
import type { PAGE_VIEW } from "../../../app/constants.ts";
import type { ScreenshotDraft } from "../../../shared/screenshots/types.ts";
import type { planSaveError } from "./plan-save-error.ts";

export type PlanPlaybookFieldProps = {
  initial?: PlaybookReference;
};

export type PlanPlaybookLinkProps = {
  reference?: PlaybookReference;
};

export type PlanReviewFieldsProps = { review: Plan["review"] };

export type FormError =
  | "invalid"
  | "invalidReason"
  | "invalidOutcome"
  | "invalidDates"
  | "invalidAnalysis"
  | ReturnType<typeof planSaveError>;

export type PlanEditorPageProps = {
  id?: string;
  section?: typeof PAGE_VIEW.REVIEW | typeof PAGE_VIEW.TRADES;
};

export type PlanEditorProps = {
  plan?: Plan;
  section?: typeof PAGE_VIEW.REVIEW | typeof PAGE_VIEW.TRADES;
};

export type AnalysisDraft = {
  id: string;
  timeframe: string;
  text: string;
  screenshots: ScreenshotDraft[];
};

export type AnalysisFieldsProps = {
  blocks: readonly AnalysisDraft[];
  onChange: (blocks: AnalysisDraft[]) => void;
  saving: boolean;
};

export type PlanTradeFieldsProps = {
  planId: string;
  changes: ReadonlyMap<string, PlanTradeChange>;
  onChange: (change: PlanTradeChange) => void;
};

export type PlanHeaderFieldsProps = { setup?: PlanSetup };

export type PlanExecutionFieldsProps = { setup?: PlanSetup };

export type PlanSetupDetailsProps = {
  setup: PlanSetup;
  analysis?: boolean;
};

export type PlanAnalysisProps = {
  blocks?: readonly PlanAnalysisBlock[];
};
