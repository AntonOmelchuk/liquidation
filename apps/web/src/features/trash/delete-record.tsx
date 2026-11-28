import { TRASH_ACTION } from "@liquidation/domain/journal/trash/constants";
import { useEffect, useId, useRef, useState } from "react";
import { useLocale } from "../../shared/messages.ts";
import { ICON_ACTION } from "../../shared/ui/constants.ts";
import { IconAction } from "../../shared/ui/icon-action.tsx";
import { useJournal } from "../journal/data/store.ts";
import { useTrashMessages } from "./messages.ts";
import type { DeleteRecordProps } from "./types.ts";
import "./trash.css";

export function DeleteRecord({
  kind,
  recordKey,
  revision,
  legacyThoughtRevision,
  afterDelete,
  disabled,
  recordLabel,
}: DeleteRecordProps) {
  const { t } = useLocale();
  const m = useTrashMessages();
  const update = useJournal((state) => state.updateTrash);
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useId();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const label = [m.delete, m[kind], recordLabel].filter(Boolean).join(" · ");

  useEffect(() => {
    if (open && dialog.current && !dialog.current.open)
      dialog.current.showModal();
  }, [open]);

  async function remove() {
    if (saving) return;
    setSaving(true);
    setError(false);
    try {
      await update({
        action: TRASH_ACTION.MOVE,
        kind,
        key: recordKey,
        revision,
        legacyThoughtRevision,
      });
      dialog.current?.close();
      afterDelete?.();
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <IconAction
        icon={ICON_ACTION.DELETE}
        label={label}
        aria-haspopup="dialog"
        disabled={disabled || saving}
        onClick={() => {
          setError(false);
          setOpen(true);
        }}
      />
      {open && (
        <dialog
          ref={dialog}
          aria-labelledby={heading}
          onClose={() => setOpen(false)}
          onCancel={(event) => {
            if (saving) event.preventDefault();
          }}
        >
          <h2 id={heading}>{m.confirm}</h2>
          <p>
            {m[kind]} · {m.explanation}
          </p>
          {error && (
            <p className="error" role="alert">
              {m.error}
            </p>
          )}
          <div className="workspace-actions">
            <button
              type="button"
              className="secondary"
              disabled={saving}
              onClick={() => dialog.current?.close()}
              autoFocus
            >
              {t.cancel}
            </button>
            <button
              type="button"
              className="trash-confirm"
              disabled={saving}
              onClick={() => void remove()}
            >
              {saving ? t.saving : m.move}
            </button>
          </div>
        </dialog>
      )}
    </>
  );
}
