import {
  BACKUP_MEDIA_TYPE,
  BACKUP_ROUTES,
  MAX_BACKUP_BYTES,
} from "@liquidation/domain/backup/constants";
import type { BackupPreview } from "@liquidation/domain/backup/types";
import { HTTP_STATUS } from "@liquidation/domain/journal/constants";
import { useId, useRef, useState } from "react";
import { useLocale } from "../../shared/messages.ts";
import {
  cancelBackup,
  JournalRequestError,
  previewBackup,
} from "../journal/data/api.ts";
import { useJournal } from "../journal/data/store.ts";
import { BACKUP_COUNTS, BACKUP_ERROR, BACKUP_TASK } from "./constants.ts";
import { useBackupMessages } from "./messages.ts";
import type { BackupError, BackupTask } from "./types.ts";
import "./backup-settings.css";

function backupError(error: unknown): BackupError {
  if (!(error instanceof JournalRequestError)) return BACKUP_ERROR.FAILED;
  if (error.status === HTTP_STATUS.CONFLICT) return BACKUP_ERROR.CONFLICT;
  if (error.status === HTTP_STATUS.CONTENT_TOO_LARGE) return BACKUP_ERROR.LARGE;
  if (
    error.status === HTTP_STATUS.UNPROCESSABLE_CONTENT ||
    error.status === HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE
  )
    return BACKUP_ERROR.INVALID;
  return BACKUP_ERROR.FAILED;
}

export function BackupSettings() {
  const m = useBackupMessages();
  const { t, format } = useLocale();
  const field = useRef<HTMLInputElement>(null);
  const heading = useId();
  const restore = useJournal((state) => state.restoreBackup);
  const [preview, setPreview] = useState<BackupPreview>();
  const [task, setTask] = useState<BackupTask>();
  const [error, setError] = useState<BackupError>();
  const [safetyId, setSafetyId] = useState<string>();
  const summary = preview?.summary;

  function clearPreview() {
    if (preview) void cancelBackup(preview.token).catch(() => undefined);
    setPreview(undefined);
    setError(undefined);
  }

  async function choose(file: File) {
    clearPreview();
    if (file.size > MAX_BACKUP_BYTES) {
      setError(BACKUP_ERROR.LARGE);
      return;
    }
    setTask(BACKUP_TASK.PREVIEW);
    try {
      setPreview(await previewBackup(file));
    } catch (failure) {
      setError(backupError(failure));
    } finally {
      setTask(undefined);
    }
  }

  async function confirm() {
    if (!preview || task) return;
    setTask(BACKUP_TASK.RESTORE);
    setError(undefined);
    try {
      setSafetyId(await restore(preview.token));
    } catch (failure) {
      setError(backupError(failure));
    } finally {
      setPreview(undefined);
      setTask(undefined);
    }
  }

  return (
    <section
      className="backup-settings"
      aria-labelledby={heading}
      aria-busy={Boolean(task)}
    >
      <h3 id={heading}>{m.title}</h3>
      <p>{m.description}</p>
      <div className="workspace-actions">
        <a
          className="action-link secondary"
          href={BACKUP_ROUTES.download}
          download
        >
          {m.download}
        </a>
        <button
          type="button"
          className="secondary"
          disabled={Boolean(task)}
          onClick={() => field.current?.click()}
        >
          {m.choose}
        </button>
        <input
          ref={field}
          hidden
          type="file"
          accept={".zip," + BACKUP_MEDIA_TYPE}
          disabled={Boolean(task)}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            if (file) void choose(file);
          }}
        />
      </div>
      {task && (
        <p role="status">
          {task === BACKUP_TASK.PREVIEW ? m.checking : m.restoring}
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {m[error]}
        </p>
      )}
      {summary && (
        <div className="backup-preview">
          <header>
            <strong>{m.preview}</strong>
            <small>
              {format.date.format(Date.parse(summary.createdAt))} ·{" "}
              {summary.currency}
            </small>
          </header>
          <dl className="backup-counts">
            {BACKUP_COUNTS.map((key) => (
              <div key={key}>
                <dt>{m[key]}</dt>
                <dd>{format.integer.format(summary[key])}</dd>
              </div>
            ))}
          </dl>
          {summary.missingScreenshots > 0 && (
            <p className="error">
              {m.missing} · {format.integer.format(summary.missingScreenshots)}
            </p>
          )}
          <p>{m.confirm}</p>
          <div className="workspace-actions">
            <button
              type="button"
              className="secondary"
              onClick={clearPreview}
              disabled={Boolean(task)}
            >
              {t.cancel}
            </button>
            <button
              type="button"
              onClick={() => void confirm()}
              disabled={Boolean(task)}
            >
              {m.replace}
            </button>
          </div>
        </div>
      )}
      {safetyId && (
        <div className="backup-success">
          <p className="positive" role="status">
            {m.restored}
          </p>
          <a
            className="record-link"
            href={BACKUP_ROUTES.safety + safetyId}
            download
          >
            {m.downloadSafety}
          </a>
        </div>
      )}
    </section>
  );
}
