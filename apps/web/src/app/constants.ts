export const PAGE = {
  JOURNAL: "journal",
  PLANS: "plans",
  PLAYBOOKS: "playbooks",
  STATISTICS: "statistics",
  REVIEW: "review",
  BACKTESTS: "backtests",
  REPORTS: "reports",
  LECTURES: "lectures",
  NOTES: "notes",
  BEST_TRADES: "best-trades",
  MISSED_TRADES: "missed-trades",
  THOUGHTS: "thoughts",
  WATCHLIST: "watchlist",
  TRASH: "trash",
  ACCOUNTS: "accounts",
  CARDS: "cards",
  GUIDE: "guide",
  MISTAKES: "mistakes",
  NEWS_REACTIONS: "news-reactions",
} as const;

export const PAGE_VIEW = {
  LIST: "list",
  NEW: "new",
  DETAILS: "details",
  EDIT: "edit",
  REVIEW: "review",
  TRADES: "trades",
  LINKS: "links",
  OPEN: "open",
  CLOSE: "close",
  SAMPLES: "samples",
} as const;

export const PAGE_HASHES = {
  [PAGE.JOURNAL]: "#journal",
  [PAGE.PLANS]: "#plans",
  [PAGE.PLAYBOOKS]: "#playbooks",
  [PAGE.STATISTICS]: "#statistics",
  [PAGE.REVIEW]: "#review",
  [PAGE.BACKTESTS]: "#backtests",
  [PAGE.REPORTS]: "#reports",
  [PAGE.LECTURES]: "#lectures",
  [PAGE.NOTES]: "#notes",
  [PAGE.BEST_TRADES]: "#best-trades",
  [PAGE.MISSED_TRADES]: "#missed-trades",
  [PAGE.THOUGHTS]: "#thoughts",
  [PAGE.WATCHLIST]: "#watchlist",
  [PAGE.TRASH]: "#trash",
  [PAGE.ACCOUNTS]: "#accounts",
  [PAGE.CARDS]: "#cards",
  [PAGE.GUIDE]: "#guide",
  [PAGE.MISTAKES]: "#mistakes",
  [PAGE.NEWS_REACTIONS]: "#news-reactions",
} as const;
export const LEGACY_LEARNING_HREF = "#learning";

export const RECENT_REVIEW_HREF = PAGE_HASHES.reports + "/recent";
export const NEW_TRADE_HREF = PAGE_HASHES.journal + "/" + PAGE_VIEW.NEW;
export const OPEN_POSITION_HREF = PAGE_HASHES.journal + "/" + PAGE_VIEW.OPEN;
export const NEW_PLAN_HREF = `${PAGE_HASHES.plans}/${PAGE_VIEW.NEW}`;
export const NEW_PLAYBOOK_HREF = `${PAGE_HASHES.playbooks}/${PAGE_VIEW.NEW}`;
export const NEW_BACKTEST_HREF = `${PAGE_HASHES.backtests}/${PAGE_VIEW.NEW}`;
export const PREFERENCES_KEY = "liquidation.preferences";
