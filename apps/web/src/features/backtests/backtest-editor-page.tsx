import { backtestCommand } from "@liquidation/domain/backtests/backtest";
import { BACKTEST_ACTION } from "@liquidation/domain/backtests/constants";
import { PLAYBOOK_STATUS } from "@liquidation/domain/playbooks/constants";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { PAGE_HASHES } from "../../app/constants.ts";
import { backtestHref } from "../../app/page.ts";
import { useLocale } from "../../shared/messages.ts";
import { Panel, RecordActions } from "../../shared/ui/layout.tsx";
import { SelectField } from "../../shared/ui/select-field.tsx";
import { JournalRequestError } from "../journal/data/api.ts";
import { JOURNAL_STATUS } from "../journal/data/constants.ts";
import { useJournal } from "../journal/data/store.ts";
import { JournalUnavailable } from "../journal/journal-unavailable.tsx";
import { useBacktestMessages } from "./messages.ts";
import type { BacktestEditorProps } from "./types.ts";

export function BacktestEditorPage({ id }: { id?: string }) {
  const status = useJournal((state) => state.status);
  const run = useJournal((state) =>
    state.backtests.find((item) => item.id === id),
  );
  const b = useBacktestMessages();
  if (status !== JOURNAL_STATUS.READY || (id && !run)) {
    return (
      <JournalUnavailable
        backHref={PAGE_HASHES.backtests}
        backLabel={b.back}
        missing={b.missing}
      />
    );
  }
  return <BacktestEditor key={id ?? "new"} run={run} />;
}

function BacktestEditor({ run }: BacktestEditorProps) {
  const { t } = useLocale();
  const b = useBacktestMessages();
  const saveRun = useJournal((state) => state.updateBacktest);
  const playbooks = useJournal((state) => state.playbooks);
  const [id] = useState(() => run?.id ?? crypto.randomUUID());
  const [revision] = useState(() => run?.revision);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<"invalid" | "conflict" | "saveError">();
  const heading = useRef<HTMLHeadingElement>(null);
  const backHref = run ? backtestHref(run.id) : PAGE_HASHES.backtests;

  useEffect(() => {
    window.scrollTo(0, 0);
    heading.current?.focus({ preventScroll: true });
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const data = new FormData(event.currentTarget);
    const [bookId, version] = String(data.get("playbook") ?? "").split("/");
    const command = backtestCommand.safeParse({
      action: run ? BACKTEST_ACTION.EDIT : BACKTEST_ACTION.CREATE,
      revision,
      id,
      metadata: {
        title: data.get("title"),
        thesis: data.get("thesis"),
        playbook: bookId ? { id: bookId, version: Number(version) } : undefined,
      },
    });
    if (!command.success) {
      setError("invalid");
      return;
    }
    setSaving(true);
    setError(undefined);
    try {
      await saveRun(command.data);
      window.location.replace(backtestHref(id));
    } catch (failure) {
      setError(
        failure instanceof JournalRequestError && failure.status === 409
          ? "conflict"
          : "saveError",
      );
      setSaving(false);
    }
  }

  const books = playbooks.filter(
    ({ id, status }) =>
      status !== PLAYBOOK_STATUS.RETIRED || id === run?.playbook?.id,
  );

  return (
    <main className="record-editor">
      <a className="record-back" href={backHref}>
        ← {run ? b.backToSession : b.back}
      </a>
      <header className="page-heading plan-detail-heading">
        <h1 ref={heading} tabIndex={-1}>
          {run ? b.edit : b.new}
        </h1>
      </header>
      <form className="layout" onSubmit={save}>
        <Panel title={b.thesis}>
          <fieldset disabled={saving}>
            <label>
              {b.name}
              <input
                required
                name="title"
                maxLength={120}
                defaultValue={run?.title}
              />
            </label>
            <SelectField
              label={b.playbookVersion}
              name="playbook"
              defaultValue={
                run?.playbook
                  ? `${run.playbook.id}/${run.playbook.version}`
                  : ""
              }
            >
              <option value="">{b.noPlaybook}</option>
              {books.map((book) => (
                <optgroup key={book.id} label={book.title}>
                  {book.versions.toReversed().map(({ number }) => (
                    <option key={number} value={`${book.id}/${number}`}>
                      v{number}
                    </option>
                  ))}
                </optgroup>
              ))}
            </SelectField>
            <label className="wide">
              {b.thesis}
              <textarea
                name="thesis"
                rows={5}
                maxLength={4000}
                defaultValue={run?.thesis}
              />
            </label>
          </fieldset>
        </Panel>
        <RecordActions
          backHref={backHref}
          cancel={t.cancel}
          submit={saving ? t.saving : b.save}
          saving={saving}
          error={error ? b[error] : undefined}
        />
      </form>
    </main>
  );
}
