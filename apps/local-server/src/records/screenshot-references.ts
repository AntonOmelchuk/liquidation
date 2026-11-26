import { tradeScreenshotIds } from "@liquidation/domain/trades/trade-evidence";
import { TRASH_KIND } from "@liquidation/domain/journal/trash/constants";
import { trashedRecords } from "@liquidation/domain/journal/trash/trash";
import type { Journal } from "@liquidation/domain/journal/types";
import { planScreenshotIds } from "@liquidation/domain/plans/plan-lifecycle";
import { playbookScreenshotIds } from "@liquidation/domain/playbooks/playbook";
import { learningScreenshotIds } from "@liquidation/domain/workspace/learning";
import { highlightScreenshotIds } from "@liquidation/domain/workspace/highlights";

export function journalScreenshotIds({
  trades,
  positions,
  plans,
  playbooks,
  backtests,
  workspace,
  trash,
}: Journal) {
  const ids = new Set<string>();
  const add = (values?: Iterable<string>) => {
    for (const id of values ?? []) ids.add(id);
  };
  for (const trade of [
    ...trades,
    ...positions,
    ...trashedRecords(trash, TRASH_KIND.TRADE),
    ...trashedRecords(trash, TRASH_KIND.POSITION),
  ])
    add(tradeScreenshotIds(trade));
  for (const plan of [...plans, ...trashedRecords(trash, TRASH_KIND.PLAN)])
    add(planScreenshotIds(plan));
  for (const book of [
    ...playbooks,
    ...trashedRecords(trash, TRASH_KIND.PLAYBOOK),
  ])
    add(playbookScreenshotIds(book));
  for (const run of [
    ...backtests,
    ...trashedRecords(trash, TRASH_KIND.BACKTEST),
  ])
    add(run.samples.flatMap(({ screenshotIds }) => screenshotIds));
  for (const item of [
    ...workspace.learning,
    ...trashedRecords(trash, TRASH_KIND.LEARNING),
  ])
    add(learningScreenshotIds(item));
  for (const item of [
    ...workspace.highlights,
    ...trashedRecords(trash, TRASH_KIND.HIGHLIGHT),
  ])
    add(highlightScreenshotIds(item));
  for (const item of [
    ...workspace.preparations,
    ...trashedRecords(trash, TRASH_KIND.PREPARATION),
    ...workspace.thoughts,
    ...trashedRecords(trash, TRASH_KIND.THOUGHT),
    ...workspace.missedTrades,
    ...trashedRecords(trash, TRASH_KIND.MISSED),
  ])
    add(item.screenshotIds);
  for (const list of [
    ...workspace.watchlists,
    ...trashedRecords(trash, TRASH_KIND.WATCHLIST),
  ])
    add(list.items.flatMap(({ screenshotIds }) => screenshotIds));
  for (const report of [
    ...workspace.reports,
    ...trashedRecords(trash, TRASH_KIND.REPORT),
  ])
    add(report.screenshotIds);
  return ids;
}
