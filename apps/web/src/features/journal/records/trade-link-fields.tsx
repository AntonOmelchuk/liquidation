import { canLinkPlan } from "@liquidation/domain/plans/plan-lifecycle";
import {
  CHECKLIST_PHASE,
  PLAYBOOK_STATUS,
} from "@liquidation/domain/playbooks/constants";
import {
  rulesForSetup,
  tradePlaybookRules,
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
import {
  useHistoricalPlanOptions,
  useHistoricalPlaybookOptions,
} from "../data/references.ts";
import { useJournal } from "../data/store.ts";
import { useTrashMessages } from "../../trash/messages.ts";
import {
  AccountField,
  readAccountLink,
} from "../../accounts/account-field.tsx";
import { TradePriceFields, readTradePrices } from "./trade-price-fields.tsx";
import { PlanField } from "./plan-field.tsx";
import { readTradeTags, TradeTagFields } from "./trade-tag-fields.tsx";

export function readTradeLinks(data: FormData) {
  const id = data.get("playbookId");
  const entry = readChecklist(data, CHECKLIST_PHASE.ENTRY);
  const management = readChecklist(data, CHECKLIST_PHASE.MANAGEMENT);
  const setupId = data.get("setupId") || undefined;
  return {
    ...readTradeTags(data),
    ...readAccountLink(data),
    prices: readTradePrices(data),
    breakeven: data.has("breakeven") || undefined,
    timeframe: String(data.get("timeframe") ?? "").trim() || undefined,
    planId: data.get("planId") || undefined,
    playbook: id ? { id, setupId, entry, management } : undefined,
  };
}

function LinkedPlaybookRules({
  book,
  initial,
  historic,
  closed,
  closing,
  context,
}: LinkedPlaybookRulesProps) {
  const b = usePlaybookMessages();
  const [setupId, setSetupId] = useState(
    initial?.setupId ??
      (!initial && book.rules.setups.length === 1
        ? book.rules.setups[0].id
        : ""),
  );
  const sameSetup = Boolean(initial && setupId === (initial.setupId ?? ""));
  const recorded =
    sameSetup && initial ? tradePlaybookRules(book, initial) : undefined;
  const rules = recorded ?? rulesForSetup(book.rules, setupId || undefined);
  const oldSetupId = initial?.setupId;
  const oldSetup =
    oldSetupId && !book.rules.setups.some(({ id }) => id === oldSetupId)
      ? ((initial && tradePlaybookRules(book, initial)?.setupName) ??
        b.onlySetup)
      : undefined;

  return (
    <>
      <SelectField
        label={b.setup}
        name="setupId"
        value={setupId}
        onChange={(event) => setSetupId(event.target.value)}
      >
        <option value="">{b.noSetup}</option>
        {oldSetupId && oldSetup !== undefined && (
          <option value={oldSetupId}>{oldSetup || b.onlySetup}</option>
        )}
        {book.rules.setups.map(({ id, name }) => (
          <option key={id} value={id}>
            {name || b.onlySetup}
          </option>
        ))}
      </SelectField>
      {!historic && <PlaybookFrame book={book} context={context} />}
      <ChecklistFields
        phase={CHECKLIST_PHASE.ENTRY}
        key={setupId}
        rules={rules.entry}
        initial={sameSetup ? initial?.entry : undefined}
        recordByDefault={Boolean(setupId)}
        requireRecording={
          !historic ||
          !initial ||
          setupId !== (initial.setupId ?? "") ||
          Boolean(initial.entry)
        }
      />
      {closed && (
        <ChecklistFields
          phase={CHECKLIST_PHASE.MANAGEMENT}
          key={setupId + CHECKLIST_PHASE.MANAGEMENT}
          rules={rules.management}
          initial={sameSetup ? initial?.management : undefined}
          recordByDefault
          requireRecording={
            closing || !historic || !initial || Boolean(initial.management)
          }
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
  showAccount = true,
  showPrices = true,
}: TradeLinkFieldsProps) {
  const b = usePlaybookMessages();
  const { t } = useLocale();
  const deleted = useTrashMessages().deleted;
  const plans = useHistoricalPlanOptions(initial?.planId);
  const playbooks = useHistoricalPlaybookOptions(initial?.playbook?.id);
  const activeBooks = useJournal((state) => state.playbooks);
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
      {showAccount && <AccountField initial={initial} />}
      {showPrices && (
        <TradePriceFields initial={initial} closed={closed || closing} />
      )}
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
            {!activeBooks.some((book) => book.id === id) && " · " + deleted}
          </option>
        ))}
      </PlaybookSelect>
      {selected && (
        <LinkedPlaybookRules
          key={selected.id}
          book={selected}
          initial={
            initial?.playbook?.id === selected.id ? initial.playbook : undefined
          }
          historic={historic}
          closed={closed || closing}
          closing={closing}
          context={{ openedAt, risk, editingId }}
        />
      )}
    </>
  );
}
