import { HTTP_STATUS } from "@liquidation/domain/journal/constants";
import { workspaceCommand } from "@liquidation/domain/workspace/workspace";
import { useRef, useState } from "react";
import { JournalRequestError } from "../journal/data/api.ts";
import { useJournal } from "../journal/data/store.ts";
import { WORKSPACE_SAVE } from "./constants.ts";
import type { WorkspaceSaveStatus } from "./types.ts";

export function useWorkspaceSave() {
  const update = useJournal((state) => state.updateWorkspace);
  const pending = useRef(false);
  const [status, setStatus] = useState<WorkspaceSaveStatus>();
  async function save(
    input: unknown,
    uploads?: ReadonlyMap<string, File> | null,
  ) {
    if (pending.current) return false;
    if (uploads === null) {
      setStatus(WORKSPACE_SAVE.UPLOAD_LIMIT);
      return false;
    }
    const command = workspaceCommand.safeParse(input);
    if (!command.success) {
      setStatus(WORKSPACE_SAVE.INVALID);
      return false;
    }
    pending.current = true;
    setStatus(WORKSPACE_SAVE.SAVING);
    try {
      await update(command.data, uploads);
      setStatus(WORKSPACE_SAVE.SAVED);
      return true;
    } catch (error) {
      setStatus(
        error instanceof JournalRequestError &&
          error.status === HTTP_STATUS.CONFLICT
          ? WORKSPACE_SAVE.CONFLICT
          : WORKSPACE_SAVE.ERROR,
      );
      return false;
    } finally {
      pending.current = false;
    }
  }
  return { status, save, saving: status === WORKSPACE_SAVE.SAVING };
}
