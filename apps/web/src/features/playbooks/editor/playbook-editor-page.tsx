import {
  PLAYBOOK_ACTION,
  PLAYBOOK_STATUS,
  PLAYBOOK_STATUSES,
} from "@liquidation/domain/playbooks/constants";
import {
  currentVersion,
  playbookCommand,
} from "@liquidation/domain/playbooks/playbook";
import type {
  PlaybookRule,
  PlaybookRules,
} from "@liquidation/domain/playbooks/types";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { PAGE_HASHES } from "../../../app/constants.ts";
import { playbookHref } from "../../../app/page.ts";
import { useLocale } from "../../../shared/messages.ts";
import { Panel, RecordActions } from "../../../shared/ui/layout.tsx";
import { SelectField } from "../../../shared/ui/select-field.tsx";
import { JournalRequestError } from "../../journal/data/api.ts";
import { JOURNAL_STATUS } from "../../journal/data/constants.ts";
import { useJournal } from "../../journal/data/store.ts";
import { JournalUnavailable } from "../../journal/journal-unavailable.tsx";
import { COUNT_LIMITS, LIMIT_NAMES } from "../limits.ts";
import { usePlaybookMessages } from "../messages.ts";
import { emptySetup, RuleFields, SetupFields } from "./rules-editor.tsx";
import type { PlaybookEditorProps } from "./types.ts";

function filledRules(rules: PlaybookRule[]) {
  return rules.filter(({ label, detail }) => label.trim() || detail.trim());
}

function readNumber(data: FormData, field: string) {
  const value = data.get(field);
  return value ? Number(value) : undefined;
}

export function PlaybookEditorPage({ id }: { id?: string }) {
  const b = usePlaybookMessages();
  const status = useJournal((state) => state.status);
  const book = useJournal((state) =>
    state.playbooks.find((item) => item.id === id),
  );

  if (status !== JOURNAL_STATUS.READY || (id && !book)) {
    return (
      <JournalUnavailable
        backHref={PAGE_HASHES.playbooks}
        backLabel={b.back}
        missing={b.missing}
      />
    );
  }
  return <PlaybookEditor key={id ?? "new"} book={book} />;
}

function PlaybookEditor({ book }: PlaybookEditorProps) {
  const { t } = useLocale();
  const b = usePlaybookMessages();
  const savePlaybook = useJournal((state) => state.updatePlaybook);
  const [id] = useState(() => book?.id ?? crypto.randomUUID());
  const [revision] = useState(() => book?.revision);
  const [rules, setRules] = useState<PlaybookRules>(() =>
    book
      ? currentVersion(book)
      : { setups: [emptySetup()], filters: [], management: [] },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<"invalid" | "saveError" | "conflict">();
  const heading = useRef<HTMLHeadingElement>(null);
  const backHref = book ? playbookHref(id) : PAGE_HASHES.playbooks;

  useEffect(() => {
    window.scrollTo(0, 0);
    heading.current?.focus({ preventScroll: true });
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const data = new FormData(event.currentTarget);
    const command = playbookCommand.safeParse({
      action: book ? PLAYBOOK_ACTION.EDIT : PLAYBOOK_ACTION.CREATE,
      id,
      revision,
      metadata: {
        title: data.get("title"),
        status: data.get("status"),
        overview: data.get("overview"),
        notes: data.get("notes"),
        reviewEvery: readNumber(data, "reviewEvery"),
        limits: Object.fromEntries(
          LIMIT_NAMES.map((name) => [name, readNumber(data, name)]),
        ),
      },
      rules: {
        setups: rules.setups.map((setup) => ({
          ...setup,
          rules: filledRules(setup.rules),
        })),
        filters: filledRules(rules.filters),
        management: filledRules(rules.management),
      },
    });
    if (!command.success) {
      setError("invalid");
      return;
    }

    setSaving(true);
    setError(undefined);
    try {
      await savePlaybook(command.data);
      window.location.replace(playbookHref(id));
    } catch (failure) {
      setError(
        failure instanceof JournalRequestError && failure.status === 409
          ? "conflict"
          : "saveError",
      );
      setSaving(false);
    }
  }

  return (
    <main className="record-editor">
      <a className="record-back" href={backHref}>
        ← {book ? b.backToPlaybook : b.back}
      </a>
      <div className="page-heading plan-detail-heading">
        <h1 ref={heading} tabIndex={-1}>
          {book ? b.edit : b.new}
        </h1>
      </div>
      <form className="layout" onSubmit={save}>
        <fieldset className="record-form-sections" disabled={saving}>
          <Panel title={b.overview}>
            <div className="record-field-grid">
              <label className="wide">
                {b.name}
                <input
                  name="title"
                  required
                  maxLength={120}
                  defaultValue={book?.title}
                />
              </label>
              <SelectField
                label={b.status}
                name="status"
                defaultValue={book?.status ?? PLAYBOOK_STATUS.EXPERIMENT}
              >
                {PLAYBOOK_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {b[status]}
                  </option>
                ))}
              </SelectField>
              <label>
                {b.reviewEvery}
                <input
                  type="number"
                  name="reviewEvery"
                  min={1}
                  max={10000}
                  step={1}
                  defaultValue={book?.reviewEvery}
                />
              </label>
              <label className="wide">
                {b.strategy}
                <textarea
                  name="overview"
                  rows={3}
                  maxLength={4000}
                  defaultValue={book?.overview}
                />
              </label>
            </div>
          </Panel>
          <Panel title={b.setups}>
            <SetupFields
              setups={rules.setups}
              onChange={(setups) =>
                setRules((previous) => ({ ...previous, setups }))
              }
            />
          </Panel>
          <Panel title={b.filters}>
            <RuleFields
              rules={rules.filters}
              onChange={(filters) =>
                setRules((previous) => ({ ...previous, filters }))
              }
            />
          </Panel>
          <Panel title={b.management}>
            <RuleFields
              rules={rules.management}
              onChange={(management) =>
                setRules((previous) => ({ ...previous, management }))
              }
            />
          </Panel>
          <Panel title={b.limits}>
            <div className="record-field-grid">
              {LIMIT_NAMES.map((name) => (
                <label key={name}>
                  {b[name]}
                  <input
                    type="number"
                    name={name}
                    min={COUNT_LIMITS.has(name) ? 1 : 0.01}
                    step={COUNT_LIMITS.has(name) ? 1 : "any"}
                    max={COUNT_LIMITS.has(name) ? 10000 : 1_000_000_000}
                    defaultValue={book?.limits[name]}
                  />
                </label>
              ))}
            </div>
          </Panel>
          <Panel title={t.notes}>
            <label>
              <span className="visually-hidden">{t.notes}</span>
              <textarea
                name="notes"
                rows={4}
                maxLength={4000}
                defaultValue={book?.notes}
              />
            </label>
          </Panel>
        </fieldset>
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
