import { expect, test } from "vitest";
import {
  createFormatters,
  formatCompactDay,
} from "../../../../apps/web/src/shared/format.ts";

test.each([
  ["2026-11-24", "24.11.2026"],
  ["2026-01-03", "03.01.2026"],
  ["2000-02-29", "29.02.2000"],
])("formats a calendar day %s in compact day-first form", (day, label) => {
  expect(formatCompactDay(day)).toBe(label);
});

test.each(["uk-UA", "en-US"])(
  "keeps the numeric date format in %s",
  (locale) => {
    const format = createFormatters(locale);
    expect(
      format.day.formatRange(new Date("2026-11-24"), new Date("2026-11-26")),
    ).toBe("24.11.2026 – 26.11.2026");
    expect(format.date.format(new Date(2026, 10, 24, 9, 5))).toBe(
      "24.11.2026 · 09:05",
    );
  },
);
