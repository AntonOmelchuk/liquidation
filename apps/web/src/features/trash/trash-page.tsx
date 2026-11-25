import {
  TRASH_ACTION,
  TRASH_KIND,
} from "@liquidation/domain/journal/trash/constants";
import { trashRecordKey } from "@liquidation/domain/journal/trash/trash";
import type { TrashEntry } from "@liquidation/domain/journal/trash/types";
import { useRef, useState } from "react";
import { PAGE_HASHES } from "../../app/constants.ts";
import { useLocale } from "../../shared/messages.ts";
import { JOURNAL_STATUS } from "../journal/data/constants.ts";
import { useJournal } from "../journal/data/store.ts";
import { JournalUnavailable } from "../journal/journal-unavailable.tsx";
import { useAccountMessages } from "../accounts/messages.ts";
import { useTrashMessages } from "./messages.ts";
import { TRASH_RESULT } from "./constants.ts";
import type { TrashResult } from "./types.ts";
import "./trash.css";

function recordName(entry: TrashEntry) {
  switch (entry.kind) {
    case TRASH_KIND.TRADE:
    case TRASH_KIND.POSITION:
    case TRASH_KIND.MISSED:
      return entry.value.symbol;
    case TRASH_KIND.PLAN:
      return entry.value.setup.title;
    case TRASH_KIND.PLAYBOOK:
    case TRASH_KIND.BACKTEST:
    case TRASH_KIND.LEARNING:
      return entry.value.title;
    case TRASH_KIND.HIGHLIGHT:
      return entry.value.example?.title ?? entry.value.note.slice(0, 100);
    case TRASH_KIND.ACCOUNT:
      return entry.value.name;
    case TRASH_KIND.MOVEMENT:
      return entry.value.notes || entry.value.at.slice(0, 10);
    default:
      return trashRecordKey(entry.value);
  }
}

export default function TrashPage() {
  const { t, format } = useLocale();
  const m = useTrashMessages();
  const a = useAccountMessages();
  const entries = useJournal((state) => state.trash);
  const ready = useJournal((state) => state.status === JOURNAL_STATUS.READY);
  const update = useJournal((state) => state.updateTrash);
  const [busy, setBusy] = useState<string>();
  const [result, setResult] = useState<TrashResult>();
  const [selected, setSelected] = useState<TrashEntry>();
  const [purgeError, setPurgeError] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  async function restore(id: string) {
    if (busy) return;
    setBusy(id);
    setResult(undefined);
    try {
      await update({ action: TRASH_ACTION.RESTORE, id });
      setResult(TRASH_RESULT.RESTORED);
    } catch {
      setResult(TRASH_RESULT.ERROR);
    } finally {
      setBusy(undefined);
    }
  }

  async function purge() {
    if (busy || !selected) return;
    setBusy(selected.id);
    setPurgeError(false);
    setResult(undefined);
    try {
      await update({ action: TRASH_ACTION.PURGE, id: selected.id });
      setResult(TRASH_RESULT.PURGED);
      dialog.current?.close();
    } catch {
      setPurgeError(true);
    } finally {
      setBusy(undefined);
    }
  }

  if (!ready)
    return (
      <JournalUnavailable
        backHref={PAGE_HASHES.journal}
        backLabel={t.backJournal}
        missing={m.empty}
      />
    );
  return (
    <main>
      <div className="page-heading">
        <h1>{m.trash}</h1>
        <span className="subdued">{entries.length}</span>
      </div>
      {result && (
        <p
          role={result === TRASH_RESULT.ERROR ? "alert" : "status"}
          className={result === TRASH_RESULT.ERROR ? "error" : "positive"}
        >
          {m[result]}
        </p>
      )}
      <section className="panel">
        {entries.length ? (
          <div className="table compact-record-table">
            <table aria-label={m.trash}>
              <thead>
                <tr>
                  <th scope="col">{m.kind}</th>
                  <th scope="col">{t.notes}</th>
                  <th scope="col">{m.removed}</th>
                  <th scope="col" />
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <th scope="row">{m[entry.kind]}</th>
                    <td>
                      {recordName(entry)}
                      {entry.kind === TRASH_KIND.MOVEMENT && (
                        <small>
                          {a[entry.value.kind]} ·{" "}
                          {format.money.format(entry.value.amount)}
                        </small>
                      )}
                    </td>
                    <td>{format.date.format(Date.parse(entry.at))}</td>
                    <td>
                      <div className="workspace-actions">
                        <button
                          type="button"
                          className="secondary"
                          disabled={Boolean(busy)}
                          onClick={() => void restore(entry.id)}
                        >
                          {m.restore}
                        </button>
                        <button
                          type="button"
                          className="secondary record-delete"
                          disabled={Boolean(busy)}
                          onClick={() => {
                            setSelected(entry);
                            setPurgeError(false);
                            dialog.current?.showModal();
                          }}
                        >
                          {m.purge}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>{m.empty}</p>
        )}
      </section>
      <dialog
        ref={dialog}
        onCancel={(event) => {
          if (busy) event.preventDefault();
        }}
        onClose={() => setSelected(undefined)}
        aria-labelledby="purge-title"
      >
        <h2 id="purge-title">{m.purgeConfirm}</h2>
        {selected && (
          <strong>
            {m[selected.kind]} · {recordName(selected)}
          </strong>
        )}
        <p>{m.purgeExplanation}</p>
        {purgeError && (
          <p className="error" role="alert">
            {m.purgeError}
          </p>
        )}
        <div className="workspace-actions">
          <button
            className="secondary"
            type="button"
            disabled={Boolean(busy)}
            autoFocus
            onClick={() => dialog.current?.close()}
          >
            {t.cancel}
          </button>
          <button
            className="trash-confirm"
            type="button"
            disabled={Boolean(busy)}
            onClick={() => void purge()}
          >
            {busy ? t.saving : m.purge}
          </button>
        </div>
      </dialog>
    </main>
  );
}
