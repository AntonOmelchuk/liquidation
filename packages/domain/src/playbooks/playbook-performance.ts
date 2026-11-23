import type { Trade } from "../trades/types.ts";
import type {
  Checklist,
  ChecklistPhase,
  Playbook,
  PlaybookVersion,
} from "./types.ts";

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

export function ruleOutcomes(
  book: Playbook,
  version: PlaybookVersion,
  linked: readonly Trade[],
) {
  const assessed = linked.filter(
    ({ playbook }) =>
      playbook?.id === book.id &&
      playbook.version === version.number &&
      (playbook.entry || playbook.management),
  );
  const ruleList = [
    ...version.setups.flatMap(({ rules }) => rules),
    ...version.filters,
    ...version.management,
  ];
  const rows = ruleList.flatMap((rule) => {
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
