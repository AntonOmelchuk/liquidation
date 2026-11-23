import { expect, test } from "vitest";
import { SORT_DIRECTION } from "../../../../apps/web/src/shared/analytics/constants.ts";
import {
  closingPeriod,
  invalidDateRange,
} from "../../../../apps/web/src/shared/analytics/date-range.ts";
import {
  nextSort,
  sortRows,
} from "../../../../apps/web/src/shared/analytics/sort.ts";

const compare = new Intl.Collator("en-US", { numeric: true }).compare;

test("sorts display-independent numbers with infinity, break-even and missing values", () => {
  const values = [
    { value: null, key: "missing" },
    { value: -5, key: "loss" },
    { value: 0, key: "flat" },
    { value: 10, key: "gain-10" },
    { value: Infinity, key: "unbounded" },
    { value: 2, key: "gain-2" },
    { value: 2, key: "also-gain-2" },
  ];
  expect(
    sortRows(
      values,
      (row) => row.value,
      SORT_DIRECTION.DESCENDING,
      compare,
    ).map(({ key }) => key),
  ).toEqual([
    "unbounded",
    "gain-10",
    "gain-2",
    "also-gain-2",
    "flat",
    "loss",
    "missing",
  ]);
  expect(
    sortRows(values, (row) => row.value, SORT_DIRECTION.ASCENDING, compare).map(
      ({ key }) => key,
    ),
  ).toEqual([
    "loss",
    "flat",
    "gain-2",
    "also-gain-2",
    "gain-10",
    "unbounded",
    "missing",
  ]);
  expect(values[0].key).toBe("missing");
});

test("toggles sort direction and compares labels with embedded numbers", () => {
  const sort = nextSort<"group" | "winRate">(
    { column: "group", direction: SORT_DIRECTION.ASCENDING },
    "winRate",
  );
  expect(sort).toEqual({
    column: "winRate",
    direction: SORT_DIRECTION.DESCENDING,
  });
  expect(nextSort(sort, "winRate").direction).toBe(SORT_DIRECTION.ASCENDING);
  expect(
    sortRows(
      ["Model v10", "Model v2"],
      (row) => row,
      SORT_DIRECTION.ASCENDING,
      compare,
    ),
  ).toEqual(["Model v2", "Model v10"]);
});

test("includes the entire selected local closing day and reports reversed dates", () => {
  const day = { from: "2026-03-29", through: "2026-03-29" };
  expect(closingPeriod(day)).toEqual({
    start: new Date(2026, 2, 29).getTime(),
    end: new Date(2026, 2, 30).getTime(),
  });
  expect(invalidDateRange({ from: "2026-03-30", through: day.through })).toBe(
    true,
  );
  expect(invalidDateRange(day)).toBe(false);
});
