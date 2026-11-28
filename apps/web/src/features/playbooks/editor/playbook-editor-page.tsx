import {
  PLAYBOOK_ACTION,
  PLAYBOOK_STATUS,
  PLAYBOOK_STATUSES,
  PLAYBOOK_TEMPLATE,
} from "@liquidation/domain/playbooks/constants";
import {
  playbookCommand,
  playbookRulesScreenshotIds,
} from "@liquidation/domain/playbooks/playbook";
import type {
  PlaybookRule,
  PlaybookRules,
  PlaybookTemplate,
} from "@liquidation/domain/playbooks/types";
import {
  emptyPlaybookStrategy,
  getPlaybookTemplate,
} from "@liquidation/domain/playbooks/strategy";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { PAGE_HASHES } from "../../../app/constants.ts";
import { playbookHref } from "../../../app/page.ts";
import { useLocale } from "../../../shared/messages.ts";
import { ScreenshotField } from "../../../shared/screenshots/screenshot-field.tsx";
import { collectScreenshots } from "../../../shared/screenshots/draft.ts";
import type { ScreenshotDraft } from "../../../shared/screenshots/types.ts";
import { Panel, RecordActions } from "../../../shared/ui/layout.tsx";
import { SelectField } from "../../../shared/ui/select-field.tsx";
import { JournalRequestError } from "../../journal/data/api.ts";
import { JOURNAL_STATUS } from "../../journal/data/constants.ts";
import { useJournal } from "../../journal/data/store.ts";
import { JournalUnavailable } from "../../journal/journal-unavailable.tsx";
import { COUNT_LIMITS, LIMIT_NAMES } from "../limits.ts";
import { usePlaybookMessages } from "../messages.ts";
import { STRATEGY_UPLOAD_ERROR } from "../strategy/constants.ts";
import { useStrategyMessages } from "../strategy/messages.ts";
import { StrategyEditor } from "../strategy/strategy-editor.tsx";
import { TemplatePicker } from "../strategy/template-picker.tsx";
import { emptySetup, RuleFields, SetupFields } from "./rules-editor.tsx";
import type { PlaybookEditorProps } from "./types.ts";

function filledRules(rules: PlaybookRule[]) {
  return rules.filter(({ label, detail }) => label.trim() || detail.trim());
}

function readNumber(data: FormData, field: string) {
  const value = data.get(field);
  return value ? Number(value) : undefined;
}

export default function PlaybookEditorPage({ id }: { id?: string }) {
  const b = usePlaybookMessages();
  const status = useJournal((state) => state.status);
  const book = useJournal((state) =>
    state.playbooks.find((item) => item.id === id),
  );
  const [template, setTemplate] = useState<PlaybookTemplate>();

  if (status !== JOURNAL_STATUS.READY || (id && !book)) {
    return (
      <JournalUnavailable
        backHref={PAGE_HASHES.playbooks}
        backLabel={b.back}
        missing={b.missing}
      />
    );
  }
  if (!book && !template) return <TemplatePicker onSelect={setTemplate} />;
  return (
    <PlaybookEditor key={id ?? template} book={book} template={template} />
  );
}

function PlaybookEditor({ book, template }: PlaybookEditorProps) {
  const { t } = useLocale();
  const b = usePlaybookMessages();
  const s = useStrategyMessages();
  const savePlaybook = useJournal((state) => state.updatePlaybook);
  const [id] = useState(() => book?.id ?? crypto.randomUUID());
  const [revision] = useState(() => book?.revision);
  const [rules, setRules] = useState<PlaybookRules>(() =>
    book
      ? book.rules
      : {
          setups: [emptySetup()],
          filters: [],
          management: [],
          strategy:
            template === PLAYBOOK_TEMPLATE.STRATEGY ||
            template === PLAYBOOK_TEMPLATE.COMMUNITY
              ? emptyPlaybookStrategy(template)
              : undefined,
        },
  );
  const [screenshots, setScreenshots] = useState(
    () => new Map<string, ScreenshotDraft>(),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<
    "invalid" | "saveError" | "conflict" | typeof STRATEGY_UPLOAD_ERROR
  >();
  const heading = useRef<HTMLHeadingElement>(null);
  const backHref = book ? playbookHref(id) : PAGE_HASHES.playbooks;

  useEffect(() => {
    window.scrollTo(0, 0);
    heading.current?.focus({ preventScroll: true });
  }, []);

  function rememberScreenshots(shots: ScreenshotDraft[]) {
    setScreenshots(
      (previous) =>
        new Map([
          ...previous,
          ...shots.map((shot) => [shot.id, shot] as const),
        ]),
    );
  }

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
        strategy: rules.strategy,
        screenshotIds: rules.screenshotIds,
      },
    });
    if (!command.success) {
      setError("invalid");
      return;
    }
    const uploads = collectScreenshots([
      playbookRulesScreenshotIds(rules).map(
        (id) => screenshots.get(id) ?? { id },
      ),
    ]);
    if (!uploads) {
      setError(STRATEGY_UPLOAD_ERROR);
      return;
    }

    setSaving(true);
    setError(undefined);
    try {
      await savePlaybook(command.data, uploads);
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
    <main className="record-editor playbook-workspace">
      <a className="record-back" href={backHref}>
        ← {book ? b.backToPlaybook : b.back}
      </a>
      <div className="page-heading plan-detail-heading">
        <h1 ref={heading} tabIndex={-1}>
          {book ? b.edit : b.new}
        </h1>
        <span className="subdued">
          {s[getPlaybookTemplate(rules.strategy)]}
        </span>
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
            <div className="playbook-overview-images">
              <h3>{b.images}</h3>
              <ScreenshotField
                value={(rules.screenshotIds ?? []).map(
                  (id) => screenshots.get(id) ?? { id },
                )}
                onChange={(shots) => {
                  rememberScreenshots(shots);
                  setRules((previous) => ({
                    ...previous,
                    screenshotIds: shots.length
                      ? shots.map(({ id }) => id)
                      : undefined,
                  }));
                }}
                disabled={saving}
              />
            </div>
          </Panel>
          {rules.strategy ? (
            <StrategyEditor
              strategy={rules.strategy}
              onChange={(field, value) =>
                setRules((previous) =>
                  previous.strategy
                    ? {
                        ...previous,
                        strategy: { ...previous.strategy, [field]: value },
                      }
                    : previous,
                )
              }
              rules={rules}
              onRules={setRules}
              screenshots={screenshots}
              onScreenshots={rememberScreenshots}
            />
          ) : (
            <>
              <Panel title={b.setups}>
                <SetupFields
                  setups={rules.setups}
                  screenshots={screenshots}
                  onScreenshots={rememberScreenshots}
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
            </>
          )}
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
          error={
            error === STRATEGY_UPLOAD_ERROR
              ? s.uploadLimit
              : error
                ? b[error]
                : undefined
          }
        />
      </form>
    </main>
  );
}
