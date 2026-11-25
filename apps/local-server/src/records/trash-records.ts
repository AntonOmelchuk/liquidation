import {
  TRASH_ACTION,
  TRASH_KIND,
} from "@liquidation/domain/journal/trash/constants";
import {
  trashRecordKey,
  trashEntrySchema,
} from "@liquidation/domain/journal/trash/trash";
import type {
  TrashCommand,
  TrashEntry,
} from "@liquidation/domain/journal/trash/types";
import type { Journal } from "@liquidation/domain/journal/types";
import { isBreakevenReviewReason } from "@liquidation/domain/workspace/planning";
import { randomUUID } from "node:crypto";
import { InvalidJournalInput, JournalConflict } from "../errors.ts";
import { accountHasHistory, hasRecordReferences } from "./references.ts";

export function mutateTrash(journal: Journal, command: TrashCommand) {
  const { workspace, trash } = journal;
  const collections = {
    [TRASH_KIND.ACCOUNT]: journal.accounts,
    [TRASH_KIND.MOVEMENT]: journal.movements,
    [TRASH_KIND.TRADE]: journal.trades,
    [TRASH_KIND.POSITION]: journal.positions,
    [TRASH_KIND.PLAN]: journal.plans,
    [TRASH_KIND.PLAYBOOK]: journal.playbooks,
    [TRASH_KIND.BACKTEST]: journal.backtests,
    [TRASH_KIND.LEARNING]: workspace.learning,
    [TRASH_KIND.HIGHLIGHT]: workspace.highlights,
    [TRASH_KIND.REPORT]: workspace.reports,
    [TRASH_KIND.PREPARATION]: workspace.preparations,
    [TRASH_KIND.THOUGHT]: workspace.thoughts,
    [TRASH_KIND.WATCHLIST]: workspace.watchlists,
    [TRASH_KIND.MISSED]: workspace.missedTrades,
  } satisfies Record<TrashEntry["kind"], TrashEntry["value"][]>;

  if (command.action === TRASH_ACTION.MOVE) {
    const records: TrashEntry["value"][] = collections[command.kind];
    const index = records.findIndex(
      (item) => trashRecordKey(item) === command.key,
    );
    const value = records[index];
    if (!value)
      throw new JournalConflict("This record is no longer available.");
    if ("revision" in value && value.revision !== command.revision)
      throw new JournalConflict("This record changed before deletion.");
    if (
      command.kind === TRASH_KIND.ACCOUNT &&
      accountHasHistory(journal, command.key)
    )
      throw new JournalConflict("An account with history must be archived.");
    // Parse the tagged snapshot before mutating the active collections.
    const removed = trashEntrySchema.parse({
      id: randomUUID(),
      at: new Date().toISOString(),
      kind: command.kind,
      value,
    });
    records.splice(index, 1);
    trash.unshift(removed);
    return journal;
  }

  const index = trash.findIndex(({ id }) => id === command.id);
  const entry = trash[index];
  if (!entry)
    throw new JournalConflict("This trash entry is no longer available.");
  if (command.action === TRASH_ACTION.PURGE) {
    if (hasRecordReferences(journal, entry))
      throw new JournalConflict("Other records still reference this entry.");
    trash.splice(index, 1);
    return journal;
  }
  const records: TrashEntry["value"][] = collections[entry.kind];
  const key = trashRecordKey(entry.value);
  if (
    entry.kind === TRASH_KIND.MOVEMENT &&
    !journal.accounts.some(({ id }) => id === entry.value.accountId)
  )
    throw new JournalConflict("Restore the associated account first.");
  if (records.some((item) => trashRecordKey(item) === key)) {
    throw new JournalConflict("Another record already uses this date or ID.");
  }
  if (
    (entry.kind === TRASH_KIND.TRADE || entry.kind === TRASH_KIND.POSITION) &&
    [...journal.trades, ...journal.positions].some(({ id }) => id === key)
  ) {
    throw new JournalConflict("This trade identity is already in use.");
  }
  if (
    entry.kind === TRASH_KIND.MISSED &&
    !isBreakevenReviewReason(entry.value.reason) &&
    entry.value.planId &&
    workspace.missedTrades.some(
      ({ planId, reason }) =>
        planId === entry.value.planId && !isBreakevenReviewReason(reason),
    )
  ) {
    throw new JournalConflict(
      "A missed opportunity already exists for this plan.",
    );
  }
  if (
    entry.kind === TRASH_KIND.HIGHLIGHT &&
    !entry.value.example &&
    !journal.trades.some(({ id }) => id === entry.value.id) &&
    !trash.some(
      (item) =>
        item.kind === TRASH_KIND.TRADE && item.value.id === entry.value.id,
    )
  ) {
    throw new InvalidJournalInput("The linked trade is unavailable.");
  }
  const value =
    "revision" in entry.value
      ? {
          ...entry.value,
          revision: latestTrashedRevision(journal, entry.kind, key) + 1,
        }
      : entry.value;
  records.unshift(value);
  trash.splice(index, 1);
  return journal;
}

export function assertNewIdentity(
  journal: Journal,
  kind: TrashEntry["kind"],
  id: string,
) {
  if (
    journal.trash.some(
      (entry) => entry.kind === kind && trashRecordKey(entry.value) === id,
    )
  ) {
    throw new JournalConflict("Restore the matching record from trash.");
  }
}

export function latestTrashedRevision(
  journal: Journal,
  kind: TrashEntry["kind"],
  key: string,
) {
  return journal.trash.reduce(
    (highest, entry) =>
      entry.kind === kind &&
      trashRecordKey(entry.value) === key &&
      "revision" in entry.value
        ? Math.max(highest, entry.value.revision)
        : highest,
    0,
  );
}
