import { PLAYBOOK_TEMPLATE } from "@liquidation/domain/playbooks/constants";
import type { PlaybookTemplate } from "@liquidation/domain/playbooks/types";
import { PAGE_HASHES } from "../../../app/constants.ts";
import { usePlaybookMessages } from "../messages.ts";
import { useStrategyMessages } from "./messages.ts";
import "./strategy.css";

export function TemplatePicker({
  onSelect,
}: {
  onSelect: (template: PlaybookTemplate) => void;
}) {
  const b = usePlaybookMessages();
  const s = useStrategyMessages();
  return (
    <main className="record-editor playbook-workspace">
      <a className="record-back" href={PAGE_HASHES.playbooks}>
        ← {b.back}
      </a>
      <div className="page-heading">
        <h1>{s.choose}</h1>
      </div>
      <div className="strategy-template-grid">
        {Object.values(PLAYBOOK_TEMPLATE).map((template) => (
          <button
            className="strategy-template-card"
            key={template}
            type="button"
            onClick={() => onSelect(template)}
          >
            <strong>{s[template]}</strong>
            <span>{s[`${template}Description`]}</span>
            <span className="strategy-template-chevron" aria-hidden="true">
              ↗
            </span>
          </button>
        ))}
      </div>
    </main>
  );
}
