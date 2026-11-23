export const PLAYBOOK_STATUS = {
  EXPERIMENT: "experiment",
  ACTIVE: "active",
  RETIRED: "retired",
} as const;
export const PLAYBOOK_STATUSES = Object.values(PLAYBOOK_STATUS);
export const PLAYBOOK_ACTION = {
  CREATE: "create",
  EDIT: "edit",
  ADD_REVIEW: "add-review",
  EDIT_REVIEW: "edit-review",
} as const;
export const CHECKLIST_PHASE = {
  ENTRY: "entry",
  MANAGEMENT: "management",
} as const;

export const MAX_PLAYBOOK_SETUPS = 8;
export const MAX_PLAYBOOK_RULES = 16;
export const MAX_RULE_REASON = 500;
