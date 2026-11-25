import type { WORKSPACE_SAVE } from "./constants.ts";

export type WorkspaceSaveStatus =
  (typeof WORKSPACE_SAVE)[keyof typeof WORKSPACE_SAVE];
