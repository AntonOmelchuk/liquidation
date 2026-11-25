import { expect, test } from "vitest";
import { formatCompactDay } from "../../../../apps/web/src/shared/format.ts";

test.each([
  ["2026-11-24", "24.11.26"],
  ["2026-01-03", "03.01.26"],
  ["2000-02-29", "29.02.00"],
])("formats a calendar day %s in compact day-first form", (day, label) => {
  expect(formatCompactDay(day)).toBe(label);
});
