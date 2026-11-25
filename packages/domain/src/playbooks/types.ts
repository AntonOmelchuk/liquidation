import type { z } from "zod";
import type { CHECKLIST_PHASE, PLAYBOOK_TEMPLATE } from "./constants.ts";
import type {
  checklistSchema,
  playbookCommand,
  playbookLinkSchema,
  playbookReferenceSchema,
  playbookRulesSchema,
  playbookSchema,
} from "./playbook.ts";
import type { playbookStrategySchema, strategyRiskSchema } from "./strategy.ts";

export type Playbook = z.infer<typeof playbookSchema>;

export type PlaybookCommand = z.infer<typeof playbookCommand>;

export type PlaybookRules = z.infer<typeof playbookRulesSchema>;

export type PlaybookStrategy = z.infer<typeof playbookStrategySchema>;
export type CommunityStrategy = NonNullable<PlaybookStrategy["community"]>;
export type PlaybookTemplate =
  (typeof PLAYBOOK_TEMPLATE)[keyof typeof PLAYBOOK_TEMPLATE];
export type StrategyRiskInputs = z.infer<typeof strategyRiskSchema>;
export type StrategyRow = PlaybookStrategy["mainSessions"][number];

export type PlaybookSetup = PlaybookRules["setups"][number];

export type PlaybookRule = PlaybookSetup["rules"][number];

export type PlaybookVersion = Playbook["versions"][number];

export type PlaybookReference = z.infer<typeof playbookReferenceSchema>;

export type PlaybookReview = Playbook["reviews"][number];

export type PlaybookLimits = Playbook["limits"];

export type PlaybookLimitKey = keyof PlaybookLimits;

export type PlaybookLink = z.infer<typeof playbookLinkSchema>;

export type Checklist = z.infer<typeof checklistSchema>;

export type ChecklistPhase =
  typeof CHECKLIST_PHASE.ENTRY | typeof CHECKLIST_PHASE.MANAGEMENT;
