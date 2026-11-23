import { useLocale } from "../../shared/messages.ts";
import { JOURNAL_STATUS } from "./data/constants.ts";
import { useJournal } from "./data/store.ts";
import type { JournalUnavailableProps } from "./types.ts";

export function JournalUnavailable({
  backHref,
  backLabel,
  missing,
  loadError,
}: JournalUnavailableProps) {
  const { t } = useLocale();
  const status = useJournal((state) => state.status);
  const load = useJournal((state) => state.load);

  return (
    <main>
      <a className="record-back" href={backHref}>
        ← {backLabel}
      </a>
      {status === JOURNAL_STATUS.ERROR ? (
        <div role="alert">
          <p className="error">{loadError ?? t.loadError}</p>
          <button type="button" onClick={() => void load()}>
            {t.retry}
          </button>
        </div>
      ) : (
        <p role="status">
          {status === JOURNAL_STATUS.READY ? missing : t.loading}
        </p>
      )}
    </main>
  );
}
