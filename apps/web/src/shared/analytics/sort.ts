import { isNumber } from "@liquidation/domain/shared/guards";
import { SORT_DIRECTION } from "./constants.ts";
import type { SortDirection, SortState, SortValue } from "./types.ts";

export function nextSort<Column extends string>(
  current: SortState<Column>,
  column: Column,
  initial: SortDirection = SORT_DIRECTION.DESCENDING,
): SortState<Column> {
  return {
    column,
    direction:
      current.column !== column
        ? initial
        : current.direction === SORT_DIRECTION.ASCENDING
          ? SORT_DIRECTION.DESCENDING
          : SORT_DIRECTION.ASCENDING,
  };
}

export function sortRows<Row>(
  rows: readonly Row[],
  value: (row: Row) => SortValue,
  direction: SortDirection,
  compareText: (left: string, right: string) => number,
) {
  const order = direction === SORT_DIRECTION.ASCENDING ? 1 : -1;
  return rows
    .map((row) => ({ row, value: value(row) }))
    .sort((left, right) => {
      const a = left.value;
      const b = right.value;
      if (a === b) return 0;
      if (a === null) return 1;
      if (b === null) return -1;
      if (isNumber(a) && isNumber(b)) return (a < b ? -1 : 1) * order;
      return compareText(String(a), String(b)) * order;
    })
    .map(({ row }) => row);
}
