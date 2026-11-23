import type { Position, Trade } from "../trades/types.ts";
import type { PlaybookLimitKey } from "./types.ts";

import { realizedR } from "../trades/trade.ts";

export function playbookFrame(
  trades: readonly Trade[],
  positions: readonly Position[],
  id: string,
  openedAt: Date,
  risk: number | null,
  editingId?: string,
) {
  const at = openedAt.getTime();
  const monthStart = new Date(
    openedAt.getFullYear(),
    openedAt.getMonth(),
    1,
  ).getTime();
  const weekStart = new Date(
    openedAt.getFullYear(),
    openedAt.getMonth(),
    openedAt.getDate() - ((openedAt.getDay() + 6) % 7),
  ).getTime();
  const eligible = (record: Trade | Position) =>
    record.playbook?.id === id &&
    record.id !== editingId &&
    Date.parse(record.openedAt) <= at;
  const closed = trades.filter(eligible);
  const opened = positions.filter(eligible);
  const candidates = [...closed, ...opened];
  let weekR = 0;
  let missingRisk = 0;
  for (const trade of closed) {
    const time = Date.parse(trade.closedAt);
    if (time < weekStart || time > at) continue;
    const result = realizedR(trade);
    if (result === null) missingRisk++;
    else weekR += result;
  }

  const values = {
    maxInitialRisk: risk,
    maxTradesWeek:
      1 +
      candidates.filter(({ openedAt }) => Date.parse(openedAt) >= weekStart)
        .length,
    maxTradesMonth:
      1 +
      candidates.filter(({ openedAt }) => Date.parse(openedAt) >= monthStart)
        .length,
    maxWeekLossR: Math.max(0, -weekR),
    maxOpen:
      1 +
      opened.length +
      closed.filter(({ closedAt }) => Date.parse(closedAt) > at).length,
  } satisfies Partial<Record<PlaybookLimitKey, number | null>>;
  return { values, missingRisk };
}
