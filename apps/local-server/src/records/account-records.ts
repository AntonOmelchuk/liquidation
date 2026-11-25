import { ACCOUNT_RECORD } from "@liquidation/domain/accounts/constants";
import type { AccountCommand } from "@liquidation/domain/accounts/types";
import type { Journal } from "@liquidation/domain/journal/types";
import { TRASH_KIND } from "@liquidation/domain/journal/trash/constants";
import { trashedRecords } from "@liquidation/domain/journal/trash/trash";
import { tradeTagKey } from "@liquidation/domain/trades/trade-tags";
import type { TradeLinks } from "@liquidation/domain/trades/types";
import { InvalidJournalInput, JournalConflict } from "../errors.ts";
import { assertNewIdentity } from "./trash-records.ts";

export function normalizeAccountLink<T extends TradeLinks>(
  journal: Journal,
  input: T,
  previous?: TradeLinks,
): T {
  const account = input.accountId
    ? journal.accounts.find(({ id }) => id === input.accountId)
    : input.account &&
      journal.accounts.find(
        ({ name }) => tradeTagKey(name) === tradeTagKey(input.account!),
      );
  if (input.accountId && !account)
    throw new InvalidJournalInput("Account not found.");
  if (!account) return input;
  if (account.archived && previous?.accountId !== account.id)
    throw new InvalidJournalInput("This account is archived.");
  return { ...input, accountId: account.id, account: account.name };
}

function updateAccountLabels(
  journal: Journal,
  id: string,
  name: string,
  adoptLegacy: boolean,
) {
  const key = tradeTagKey(name);
  const records = [
    ...journal.trades,
    ...journal.positions,
    ...trashedRecords(journal.trash, TRASH_KIND.TRADE),
    ...trashedRecords(journal.trash, TRASH_KIND.POSITION),
  ];
  for (const record of records) {
    if (
      record.accountId !== id &&
      !(
        adoptLegacy &&
        !record.accountId &&
        record.account &&
        tradeTagKey(record.account) === key
      )
    )
      continue;
    if (record.accountId === id && record.account === name) continue;
    record.accountId = id;
    record.account = name;
    if ("revision" in record) record.revision++;
  }
}

function checkRevision(
  actual: number | undefined,
  expected: number | undefined,
) {
  if (actual !== expected)
    throw new JournalConflict(
      "This account record changed. Reload and try again.",
    );
}

export function mutateAccount(journal: Journal, command: AccountCommand) {
  const { id, revision } = command;
  if (command.record === ACCOUNT_RECORD.ACCOUNT) {
    const previous = journal.accounts.find((account) => account.id === id);
    checkRevision(previous?.revision, revision);
    if (!previous) assertNewIdentity(journal, TRASH_KIND.ACCOUNT, id);
    const known = [
      ...journal.accounts,
      ...trashedRecords(journal.trash, TRASH_KIND.ACCOUNT),
    ];
    if (
      known.some(
        (account) =>
          account.id !== id &&
          tradeTagKey(account.name) === tradeTagKey(command.input.name),
      )
    )
      throw new JournalConflict("An account with this name already exists.");
    if (known.length && command.input.currency !== journal.currency)
      throw new InvalidJournalInput("All accounts use the journal currency.");
    if (!known.length) journal.currency = command.input.currency;
    const record = { ...command.input, id, revision: (revision ?? 0) + 1 };
    if (previous) journal.accounts[journal.accounts.indexOf(previous)] = record;
    else journal.accounts.push(record);
    updateAccountLabels(journal, id, record.name, !previous);
  } else {
    const previous = journal.movements.find((movement) => movement.id === id);
    checkRevision(previous?.revision, revision);
    if (!previous) assertNewIdentity(journal, TRASH_KIND.MOVEMENT, id);
    if (
      !journal.accounts.some(
        (account) => account.id === command.input.accountId,
      )
    )
      throw new InvalidJournalInput("Account not found.");
    const record = { ...command.input, id, revision: (revision ?? 0) + 1 };
    if (previous)
      journal.movements[journal.movements.indexOf(previous)] = record;
    else journal.movements.unshift(record);
  }
  return journal;
}
