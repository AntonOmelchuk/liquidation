import { TRASH_KIND } from "@liquidation/domain/journal/trash/constants";
import {
  trashedRecords,
  trashRecordKey,
} from "@liquidation/domain/journal/trash/trash";
import type { TrashEntry } from "@liquidation/domain/journal/trash/types";
import type { Journal } from "@liquidation/domain/journal/types";

function knownTrades(journal: Journal) {
  return [
    ...journal.trades,
    ...journal.positions,
    ...trashedRecords(journal.trash, TRASH_KIND.TRADE),
    ...trashedRecords(journal.trash, TRASH_KIND.POSITION),
  ];
}

export function accountHasHistory(journal: Journal, id: string) {
  return [
    ...knownTrades(journal),
    ...journal.movements,
    ...trashedRecords(journal.trash, TRASH_KIND.MOVEMENT),
  ].some((record) => record.accountId === id);
}

export function hasRecordReferences(
  journal: Journal,
  entry: Pick<TrashEntry, "kind" | "value">,
) {
  const key = trashRecordKey(entry.value);
  switch (entry.kind) {
    case TRASH_KIND.ACCOUNT:
      return accountHasHistory(journal, key);
    case TRASH_KIND.TRADE:
    case TRASH_KIND.POSITION:
      return (
        [
          ...journal.workspace.reports,
          ...trashedRecords(journal.trash, TRASH_KIND.REPORT),
        ].some(
          (report) =>
            report.bestTradeId === key ||
            report.assessments.some(({ id }) => id === key),
        ) ||
        [
          ...journal.workspace.highlights,
          ...trashedRecords(journal.trash, TRASH_KIND.HIGHLIGHT),
        ].some((highlight) => !highlight.example && highlight.id === key)
      );
    case TRASH_KIND.PLAN:
      return (
        knownTrades(journal).some((trade) => trade.planId === key) ||
        [
          ...journal.workspace.missedTrades,
          ...trashedRecords(journal.trash, TRASH_KIND.MISSED),
        ].some((miss) => miss.planId === key) ||
        [
          ...journal.workspace.watchlists,
          ...trashedRecords(journal.trash, TRASH_KIND.WATCHLIST),
        ].some((list) => list.items.some((item) => item.planIds.includes(key)))
      );
    case TRASH_KIND.PLAYBOOK:
      return (
        knownTrades(journal).some((trade) => trade.playbook?.id === key) ||
        [
          ...journal.plans,
          ...trashedRecords(journal.trash, TRASH_KIND.PLAN),
        ].some(
          (plan) =>
            plan.setup.playbook?.id === key ||
            plan.originalSetup?.playbook?.id === key,
        ) ||
        [
          ...journal.backtests,
          ...trashedRecords(journal.trash, TRASH_KIND.BACKTEST),
        ].some((run) => run.playbook?.id === key) ||
        [
          ...journal.workspace.highlights,
          ...trashedRecords(journal.trash, TRASH_KIND.HIGHLIGHT),
        ].some((highlight) => highlight.details?.playbook?.id === key)
      );
    default:
      return false;
  }
}
