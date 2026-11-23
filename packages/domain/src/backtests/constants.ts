export const BACKTEST_ACTION = {
  CREATE: "create",
  EDIT: "edit",
  ADD_SAMPLE: "add-sample",
  EDIT_SAMPLE: "edit-sample",
} as const;
export const BACKTEST_SAMPLE_FIELD = {
  ENTRY: "entry",
  STOP: "stop",
  EXIT: "exit",
  COSTS_R: "costsR",
} as const;
