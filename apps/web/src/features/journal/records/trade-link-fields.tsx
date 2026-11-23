import { canLinkPlan } from "@liquidation/domain/plans/plan-lifecycle";
import {
  CHECKLIST_PHASE,
  PLAYBOOK_STATUS,
} from "@liquidation/domain/playbooks/constants";
import {
  currentVersion,
  entryRules,
} from "@liquidation/domain/playbooks/playbook";
import { useState } from "react";
import type {
  LinkedPlaybookRulesProps,
  TradeLinkFieldsProps,
} from "./types.ts";

import { isoToLocalDateTime } from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import { SelectField } from "../../../shared/ui/select-field.tsx";
import {
  ChecklistFields,
  readChecklist,
} from "../../playbooks/checklist-fields.tsx";
import { usePlaybookMessages } from "../../playbooks/messages.ts";
import { PlaybookFrame } from "../../playbooks/playbook-frame.tsx";
import { PlaybookSelect } from "../../playbooks/playbook-select.tsx";
import { useJournal } from "../data/store.ts";
import { PlanField } from "./plan-field.tsx";
import { readTradeTags, TradeTagFields } from "./trade-tag-fields.tsx";

export function readTradeLinks(data: FormData) {
  const id = data.get("playbookId");
  const entry = readChecklist(data, CHECKLIST_PHASE.ENTRY);
  const management = readChecklist(data, CHECKLIST_PHASE.MANAGEMENT);
  const setupId = data.get("setupId") || undefined;
  const number = data.get("playbookVersion");
  const version =
    number && (entry || management || setupId || data.has("pinPlaybook"))
      ? Number(number)
      : undefined;
  return {
    ...readTradeTags(data),
    timeframe: String(data.get("timeframe") ?? "").trim() || undefined,
    planId: data.get("planId") || undefined,
    playbook: id ? { id, version, setupId, entry, management } : undefined,
  };
}

function LinkedPlaybookRules({
  book,
  initial,
  historic,
  closed,
  closing,
  plannedVersion,
  context,
}: LinkedPlaybookRulesProps) {
  const b = usePlaybookMessages();
  const [number] = useState(
    () => initial?.version ?? plannedVersion ?? currentVersion(book).number,
  );
  const version =
    book.versions.find(({ number: candidate }) => candidate === number) ??
    currentVersion(book);
  const [setupId, setSetupId] = useState(
    initial?.setupId ??
      (!initial && !historic && version.setups.length === 1
        ? version.setups[0].id
        : ""),
  );
  const rules = setupId ? entryRules(version, setupId) : [];
  const pinned =
    !historic || (closing && !initial) || initial?.version !== undefined;

  return (
    <>
      <input type="hidden" name="playbookVersion" value={version.number} />
      {pinned && <input type="hidden" name="pinPlaybook" value="yes" />}
      <SelectField
        label={b.setup}
        name="setupId"
        value={setupId}
        onChange={(event) => setSetupId(event.target.value)}
      >
        <option value="">{b.noSetup}</option>
        {version.setups.map(({ id, name }) => (
          <option key={id} value={id}>
            {name || b.onlySetup}
          </option>
        ))}
      </SelectField>
      <p className="wide checklist-meta">
        {!pinned && !setupId
          ? b.unversioned
          : `${b.version} · v${version.number}`}
      </p>
      {!historic && <PlaybookFrame book={book} context={context} />}
      <ChecklistFields
        phase={CHECKLIST_PHASE.ENTRY}
        rules={rules}
        initial={initial?.entry}
        recordByDefault={!historic && !initial}
      />
      {closed && (
        <ChecklistFields
          phase={CHECKLIST_PHASE.MANAGEMENT}
          rules={version.management}
          initial={initial?.management}
          recordByDefault={(closing && pinned) || (!historic && !initial)}
        />
      )}
    </>
  );
}

export function TradeLinkFields({
  openedAt,
  initial,
  historic = false,
  closed = false,
  closing = false,
  risk = null,
  editingId,
}: TradeLinkFieldsProps) {
  const b = usePlaybookMessages();
  const { t } = useLocale();
  const plans = useJournal((state) => state.plans);
  const playbooks = useJournal((state) => state.playbooks);
  const [planId, setPlanId] = useState(initial?.planId ?? "");
  const [bookId, setBookId] = useState<string>();
  const entryDay = (
    openedAt || isoToLocalDateTime(new Date().toISOString())
  ).slice(0, 10);
  const planOptions = plans.filter(
    (plan) => plan.id === initial?.planId || canLinkPlan(plan, entryDay),
  );
  const plan = planOptions.find(({ id }) => id === planId);
  const suggested =
    !initial && bookId === undefined ? plan?.setup.playbook : undefined;
  const available = playbooks.filter(
    ({ id, status }) =>
      status !== PLAYBOOK_STATUS.RETIRED || id === initial?.playbook?.id,
  );
  const selected = available.find(
    ({ id }) => id === (bookId ?? initial?.playbook?.id ?? suggested?.id),
  );

  return (
    <>
      <label>
        {t.timeframe}
        <input
          name="timeframe"
          placeholder="M15"
          maxLength={24}
          defaultValue={initial?.timeframe}
        />
      </label>
      <TradeTagFields initial={initial} />
      {plans.length > 0 && (
        <PlanField
          options={planOptions}
          value={plan?.id ?? ""}
          onChange={setPlanId}
        />
      )}
      <PlaybookSelect
        label={b.link}
        name="playbookId"
        value={selected?.id ?? ""}
        empty={!available.length}
        onChange={(event) => setBookId(event.target.value)}
      >
        <option value="">{b.none}</option>
        {available.map(({ id, title, status }) => (
          <option key={id} value={id}>
            {status === PLAYBOOK_STATUS.RETIRED
              ? `${title} · ${b.retired}`
              : title}
          </option>
        ))}
      </PlaybookSelect>
      {selected && (
        <LinkedPlaybookRules
          key={`${selected.id}:${suggested?.version ?? ""}`}
          book={selected}
          initial={
            selected.id === initial?.playbook?.id ? initial.playbook : undefined
          }
          historic={historic}
          closed={closed || closing}
          closing={closing}
          plannedVersion={suggested?.version}
          context={{ openedAt, risk, editingId }}
        />
      )}
    </>
  );
}
