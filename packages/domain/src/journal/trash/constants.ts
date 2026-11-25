export const TRASH_KIND = {
  TRADE: "trade",
  POSITION: "position",
  PLAN: "plan",
  PLAYBOOK: "playbook",
  BACKTEST: "backtest",
  LEARNING: "learning",
  HIGHLIGHT: "highlight",
  REPORT: "report",
  PREPARATION: "preparation",
  THOUGHT: "thought",
  WATCHLIST: "watchlist",
  MISSED: "missed",
  ACCOUNT: "account",
  MOVEMENT: "movement",
} as const;
export const TRASH_KINDS = Object.values(TRASH_KIND);
export const TRASH_ACTION = {
  MOVE: "move",
  RESTORE: "restore",
  PURGE: "purge",
} as const;
