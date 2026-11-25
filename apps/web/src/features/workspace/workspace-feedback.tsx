import { useLocale } from "../../shared/messages.ts";
import { useScreenshotMessages } from "../../shared/screenshots/messages.ts";
import { WORKSPACE_SAVE } from "./constants.ts";
import { useWorkspaceMessages } from "./messages.ts";
import type { WorkspaceSaveStatus } from "./types.ts";

export function WorkspaceFeedback({
  status,
}: {
  status?: WorkspaceSaveStatus;
}) {
  const m = useWorkspaceMessages();
  const images = useScreenshotMessages();
  if (!status || status === WORKSPACE_SAVE.SAVING) return null;
  return status === WORKSPACE_SAVE.SAVED ? (
    <p role="status" className="positive">
      {m.saved}
    </p>
  ) : (
    <p role="alert" className="error">
      {status === WORKSPACE_SAVE.UPLOAD_LIMIT ? images.uploadLimit : m[status]}
    </p>
  );
}

export function WorkspaceSaveButton({ saving }: { saving: boolean }) {
  const m = useWorkspaceMessages();
  const { t } = useLocale();
  return (
    <button disabled={saving} type="submit">
      {saving ? t.saving : m.save}
    </button>
  );
}
