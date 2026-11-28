import type { Trade } from "../trades/types.ts";
import type {
  Checklist,
  ChecklistPhase,
  Playbook,
  PlaybookRule,
} from "./types.ts";

import { tradePlaybookRules } from "./playbook.ts";
import { realizedR, summarize } from "../trades/trade.ts";

const allMet = (answers: Checklist) => answers.every(({ met }) => met);

export function playbookResults(trades: readonly Trade[]) {
  let totalR = 0;
  let riskMissing = 0;
  for (const trade of trades) {
    const multiple = realizedR(trade);
    if (multiple === null) riskMissing++;
    else totalR += multiple;
  }
  return {
    ...summarize(trades),
    totalR: trades.length > riskMissing ? totalR : null,
    riskMissing,
  };
}

export function adherence(trades: readonly Trade[], phase: ChecklistPhase) {
  const answers = trades.flatMap((trade) =>
    trade.playbook?.[phase] ? [trade.playbook[phase]] : [],
  );
  const met = answers.filter(allMet).length;
  return {
    count: answers.length,
    rate: answers.length ? met / answers.length : null,
  };
}

export function playbookReviewProgress(book: Playbook, closed: number) {
  if (!book.reviewEvery) return null;
  const complete = Math.floor(closed / book.reviewEvery);
  return {
    due: Math.max(0, complete - book.reviews.length),
    progress: closed % book.reviewEvery,
    size: book.reviewEvery,
  };
}

export function ruleOutcomes(book: Playbook, linked: readonly Trade[]) {
  const assessed = linked.filter(
    ({ playbook }) =>
      playbook &&
      playbook.id === book.id &&
      (playbook.entry || playbook.management),
  );
  const rules = new Map<string, PlaybookRule>();
  for (const trade of assessed) {
    if (!trade.playbook) continue;
    const evidence = tradePlaybookRules(book, trade.playbook);
    for (const rule of [
      ...(evidence?.entry ?? []),
      ...(evidence?.management ?? []),
    ])
      if (!rules.has(rule.id)) rules.set(rule.id, rule);
  }
  const rows = [...rules.values()].flatMap((rule) => {
    const misses = assessed.flatMap((trade) => {
      const answers = [
        ...(trade.playbook?.entry ?? []),
        ...(trade.playbook?.management ?? []),
      ];
      const miss = answers.find(
        ({ ruleId, met }) => ruleId === rule.id && !met,
      );
      return miss ? [{ trade, reason: miss.reason }] : [];
    });
    return misses.length
      ? [
          {
            rule,
            misses,
            results: playbookResults(misses.map(({ trade }) => trade)),
          },
        ]
      : [];
  });
  const allKept = assessed.filter(
    ({ playbook }) =>
      (playbook?.entry === undefined || allMet(playbook.entry)) &&
      (playbook?.management === undefined || allMet(playbook.management)),
  );
  return { rows, assessed: assessed.length, allKept: playbookResults(allKept) };
}
