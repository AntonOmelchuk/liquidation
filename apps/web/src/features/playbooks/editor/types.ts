import type {
  Playbook,
  PlaybookRule,
  PlaybookSetup,
} from "@liquidation/domain/playbooks/types";

export type PlaybookEditorProps = { book?: Playbook };

export type RuleFieldsProps = {
  rules: readonly PlaybookRule[];
  onChange: (rules: PlaybookRule[]) => void;
};

export type SetupFieldsProps = {
  setups: readonly PlaybookSetup[];
  onChange: (setups: PlaybookSetup[]) => void;
};
