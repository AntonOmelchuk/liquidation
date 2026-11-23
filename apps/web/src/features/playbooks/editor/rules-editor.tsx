import {
  MAX_PLAYBOOK_RULES,
  MAX_PLAYBOOK_SETUPS,
} from "@liquidation/domain/playbooks/constants";
import type {
  PlaybookRule,
  PlaybookSetup,
} from "@liquidation/domain/playbooks/types";
import type { RuleFieldsProps, SetupFieldsProps } from "./types.ts";

import { usePlaybookMessages } from "../messages.ts";

export function emptySetup(): PlaybookSetup {
  return { id: crypto.randomUUID(), name: "", description: "", rules: [] };
}

export function RuleFields({ rules, onChange }: RuleFieldsProps) {
  const b = usePlaybookMessages();

  function update(id: string, change: Partial<Omit<PlaybookRule, "id">>) {
    onChange(
      rules.map((rule) => (rule.id === id ? { ...rule, ...change } : rule)),
    );
  }

  return (
    <div className="rules-editor">
      {rules.map(({ id, label, detail }, index) => (
        <div className="rule-editor" key={id}>
          <label>
            {b.ruleLabel}
            <input
              value={label}
              onChange={(event) => update(id, { label: event.target.value })}
              maxLength={120}
              required={Boolean(detail.trim())}
            />
          </label>
          <label>
            {b.ruleDetail}
            <input
              value={detail}
              onChange={(event) => update(id, { detail: event.target.value })}
              maxLength={1000}
            />
          </label>
          <button
            type="button"
            className="secondary"
            aria-label={`${b.removeRule} · ${index + 1}`}
            onClick={() => onChange(rules.filter((rule) => rule.id !== id))}
          >
            {b.removeRule}
          </button>
        </div>
      ))}
      <div>
        <button
          type="button"
          className="secondary"
          disabled={rules.length >= MAX_PLAYBOOK_RULES}
          onClick={() =>
            onChange([
              ...rules,
              { id: crypto.randomUUID(), label: "", detail: "" },
            ])
          }
        >
          ＋ {b.addRule}
        </button>
      </div>
    </div>
  );
}

export function SetupFields({ setups, onChange }: SetupFieldsProps) {
  const b = usePlaybookMessages();

  function update(id: string, change: Partial<Omit<PlaybookSetup, "id">>) {
    onChange(
      setups.map((setup) =>
        setup.id === id ? { ...setup, ...change } : setup,
      ),
    );
  }

  return (
    <div className="rules-editor">
      {setups.map(({ id, name, description, rules }, index) => (
        <section className="setup-editor" key={id}>
          <div className="setup-editor-head">
            <label>
              {b.setupName}
              <input
                value={name}
                maxLength={120}
                required={setups.length > 1}
                placeholder={setups.length === 1 ? b.onlySetup : undefined}
                onChange={(event) => update(id, { name: event.target.value })}
              />
            </label>
            {setups.length > 1 && (
              <button
                type="button"
                className="secondary"
                aria-label={`${b.removeSetup} · ${index + 1}`}
                onClick={() =>
                  onChange(setups.filter((setup) => setup.id !== id))
                }
              >
                {b.removeSetup}
              </button>
            )}
          </div>
          <label>
            {b.setupDescription}
            <textarea
              value={description}
              maxLength={4000}
              rows={2}
              onChange={(event) =>
                update(id, { description: event.target.value })
              }
            />
          </label>
          <RuleFields
            rules={rules}
            onChange={(value) => update(id, { rules: value })}
          />
        </section>
      ))}
      <div>
        <button
          type="button"
          className="secondary"
          disabled={setups.length >= MAX_PLAYBOOK_SETUPS}
          onClick={() => onChange([...setups, emptySetup()])}
        >
          ＋ {b.addSetup}
        </button>
      </div>
    </div>
  );
}
