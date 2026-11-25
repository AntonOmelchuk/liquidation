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

export const PLAYBOOK_TEMPLATE = {
  STANDARD: "standard",
  STRATEGY: "strategy",
  COMMUNITY: "community",
} as const;
export const COMMUNITY_SOURCE =
  "https://btatrading.notion.site/strategy-for-community";
export const STRATEGY_MODEL = {
  OPERATING: "operating",
  DIRECTION: "direction",
  ENTRY: "entry",
  CONFIRMATION: "confirmation",
} as const;
export const STRATEGY_MODELS = Object.values(STRATEGY_MODEL);
export const TRADE_FREQUENCY = { WEEK: "week", MONTH: "month" } as const;
export const TRADE_FREQUENCIES = Object.values(TRADE_FREQUENCY);
export const STRATEGY_ROW_LIMIT = 16;
export const STRATEGY_WEEKDAYS = 7;
export const STRATEGY_SHORT_LIMIT = 120;
export const STRATEGY_TEXT_LIMIT = 1000;
export const STRATEGY_RISK_DEFAULTS = {
  capital: 10000,
  tradeCount: 4,
  frequency: TRADE_FREQUENCY.WEEK,
  monthsOff: 1,
  months: 12,
  winPercent: 50,
  rewardR: 3,
  riskPercent: 1,
} as const;
export const STRATEGY_RISK_INPUTS = {
  capital: { min: 0.01, max: 1_000_000_000, step: "any" },
  tradeCount: { min: 0, max: 10000, step: 1 },
  monthsOff: { min: 0, max: 120, step: 1 },
  months: { min: 1, max: 120, step: 1 },
  winPercent: { min: 0, max: 100, step: "any" },
  rewardR: { min: 0.01, max: 1000, step: "any" },
  riskPercent: { min: 0, max: 100, step: "any" },
} as const;
export const STRATEGY_LIMITS = [
  "standardRisk",
  "reducedRisk",
  "dailyTarget",
  "weeklyTarget",
  "monthlyTargetLow",
  "monthlyTargetHigh",
  "intradayRR",
  "maxDailyLoss",
  "maxWeeklyLoss",
] as const;
