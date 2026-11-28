import type {
  Playbook,
  PlaybookReview,
  PlaybookRule,
} from "@liquidation/domain/playbooks/types";
import type { Trade } from "@liquidation/domain/trades/types";

export type ReviewFormProps = {
  book: Playbook;
  previous?: PlaybookReview;
  finish: () => void;
};

export type PlaybookReviewsProps = {
  book: Playbook;
  count: number;
};

export type SetupResultsProps = {
  book: Playbook;
  trades: readonly Trade[];
};

export type RulesListProps = { rules: readonly PlaybookRule[] };
