import {
  CHECKLIST_PHASE,
  MAX_RULE_REASON,
} from "@liquidation/domain/playbooks/constants";
import type {
  Checklist,
  ChecklistPhase,
} from "@liquidation/domain/playbooks/types";
import { useState } from "react";
import type { ChecklistFieldsProps, ChecklistRowProps } from "./types.ts";

import { usePlaybookMessages } from "./messages.ts";

function ruleField(phase: ChecklistPhase) {
  return `${phase}:rule`;
}
function metField(phase: ChecklistPhase, id: string) {
  return `${phase}:met:${id}`;
}
function reasonField(phase: ChecklistPhase, id: string) {
  return `${phase}:reason:${id}`;
}

export function readChecklist(
  data: FormData,
  phase: ChecklistPhase,
): Checklist | undefined {
  const ids = data.getAll(ruleField(phase));
  if (!ids.length) return undefined;
  return ids.map((field) => {
    const ruleId = String(field);
    const met = data.has(metField(phase, ruleId));
    const reason = String(data.get(reasonField(phase, ruleId)) ?? "").trim();
    return { ruleId, met, reason: met || !reason ? undefined : reason };
  });
}

function ChecklistRow({ rule, phase, answer }: ChecklistRowProps) {
  const b = usePlaybookMessages();
  const [met, setMet] = useState(answer?.met ?? false);
  const [reason, setReason] = useState(answer?.reason ?? "");
  return (
    <div className="rule-check-row">
      <input type="hidden" name={ruleField(phase)} value={rule.id} />
      <label className="rule-check">
        <input
          type="checkbox"
          name={metField(phase, rule.id)}
          checked={met}
          onChange={(event) => setMet(event.target.checked)}
        />
        <span>
          {rule.label}
          {rule.detail && <small className="rule-detail">{rule.detail}</small>}
        </span>
      </label>
      {!met && (
        <label>
          {b.reason}
          <input
            name={reasonField(phase, rule.id)}
            maxLength={MAX_RULE_REASON}
            required={!answer || answer.met || Boolean(answer.reason)}
            pattern={String.raw`.*\S.*`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </label>
      )}
    </div>
  );
}

export function ChecklistFields({
  phase,
  rules,
  initial,
  recordByDefault = false,
  requireRecording = false,
}: ChecklistFieldsProps) {
  const b = usePlaybookMessages();
  const [recording, setRecording] = useState(
    recordByDefault || Boolean(initial),
  );
  const title =
    phase === CHECKLIST_PHASE.ENTRY ? b.entryChecklist : b.managementChecklist;
  if (!rules.length) return null;

  return (
    <div className="wide rule-checklist" role="group" aria-label={title}>
      <strong>{title}</strong>
      {requireRecording ? (
        <p className="analytics-hint">{b.checklistRequired}</p>
      ) : (
        <label className="rule-check">
          <input
            type="checkbox"
            checked={recording}
            onChange={(event) => setRecording(event.target.checked)}
          />
          <span>
            {phase === CHECKLIST_PHASE.ENTRY
              ? b.recordEntry
              : b.recordManagement}
          </span>
        </label>
      )}
      {(recording || requireRecording) &&
        rules.map((rule) => (
          <ChecklistRow
            key={rule.id}
            rule={rule}
            phase={phase}
            answer={initial?.find(({ ruleId }) => ruleId === rule.id)}
          />
        ))}
    </div>
  );
}
