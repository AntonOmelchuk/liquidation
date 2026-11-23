export const PAGE = {
  JOURNAL: "journal",
  PLANS: "plans",
  PLAYBOOKS: "playbooks",
  STATISTICS: "statistics",
  BACKTESTS: "backtests",
} as const;

export const PAGE_VIEW = {
  LIST: "list",
  NEW: "new",
  DETAILS: "details",
  EDIT: "edit",
  REVIEW: "review",
  TRADES: "trades",
  LINKS: "links",
} as const;

export const PAGE_HASHES = {
  [PAGE.JOURNAL]: "#journal",
  [PAGE.PLANS]: "#plans",
  [PAGE.PLAYBOOKS]: "#playbooks",
  [PAGE.STATISTICS]: "#statistics",
  [PAGE.BACKTESTS]: "#backtests",
} as const;

export const NEW_PLAN_HREF = `${PAGE_HASHES.plans}/${PAGE_VIEW.NEW}`;
export const NEW_PLAYBOOK_HREF = `${PAGE_HASHES.playbooks}/${PAGE_VIEW.NEW}`;
export const NEW_BACKTEST_HREF = `${PAGE_HASHES.backtests}/${PAGE_VIEW.NEW}`;
export const PREFERENCES_KEY = "liquidation.preferences";
