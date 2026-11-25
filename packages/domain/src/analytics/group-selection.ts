import type { TradeGroupRecords } from "./types.ts";

export function selectedGroupTrades(
  groups: readonly TradeGroupRecords[],
  keys: ReadonlySet<string>,
) {
  return [
    ...new Map(
      groups
        .filter(({ key }) => keys.has(key))
        .flatMap(({ records }) =>
          records.map((trade) => [trade.id, trade] as const),
        ),
    ).values(),
  ];
}
