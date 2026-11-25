import { createFactorLabels } from "../../../../apps/web/src/features/statistics/breakdown/labels.ts";
import type {
  CommonMessages,
  StatisticsMessages,
} from "../../../../apps/web/src/features/statistics/types.ts";
import { expect, test } from "vitest";

test("weekday and month names are capitalized and month labels omit the year", () => {
  const messages = {} as StatisticsMessages;
  const common = {} as CommonMessages;
  const uk = createFactorLabels([], [], "uk-UA", common, messages, []);
  const en = createFactorLabels([], [], "en-US", common, messages, []);
  expect(uk("weekday", "1")).toBe("Понеділок");
  expect(uk("weekday", "7")).toBe("Неділя");
  expect(uk("month", "11")).toBe("Листопад");
  expect(en("month", "01")).toBe("January");
  expect(en("month", "12")).toBe("December");
});
