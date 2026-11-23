import type {
  Checklist,
  ChecklistPhase,
  Playbook,
  PlaybookRule,
} from "@liquidation/domain/playbooks/types";

export type ChecklistRowProps = {
  rule: PlaybookRule;
  phase: ChecklistPhase;
  answer?: Checklist[number];
};

export type ChecklistFieldsProps = {
  phase: ChecklistPhase;
  rules: readonly PlaybookRule[];
  initial?: Checklist;
  recordByDefault?: boolean;
};

export type EntryContext = {
  openedAt: string;
  risk: number | null;
  editingId?: string;
};

export type PlaybookFrameProps = {
  book: Playbook;
  context: EntryContext;
};
