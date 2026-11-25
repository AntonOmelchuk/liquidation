import type {
  Playbook,
  PlaybookRule,
  PlaybookSetup,
  PlaybookTemplate,
} from "@liquidation/domain/playbooks/types";

import type { ScreenshotDraft } from "../../../shared/screenshots/types.ts";

export type PlaybookEditorProps = {
  book?: Playbook;
  template?: PlaybookTemplate;
};

export type RuleFieldsProps = {
  rules: readonly PlaybookRule[];
  onChange: (rules: PlaybookRule[]) => void;
};

export type SetupFieldsProps = {
  setups: readonly PlaybookSetup[];
  screenshots: ReadonlyMap<string, ScreenshotDraft>;
  onScreenshots: (shots: ScreenshotDraft[]) => void;
  onChange: (setups: PlaybookSetup[]) => void;
};
