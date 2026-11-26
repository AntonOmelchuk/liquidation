import {
  LEARNING_KIND,
  LEARNING_TOPIC,
  LECTURE_BLOCK,
} from "@liquidation/domain/workspace/constants";
import type { LearningEntry } from "@liquidation/domain/workspace/types";
import { expect, test } from "vitest";
import { LEARNING_DATE_ORDER } from "../../../../apps/web/src/features/workspace/learning/constants.ts";
import {
  filterLearningEntries,
  learningNameOptions,
} from "../../../../apps/web/src/features/workspace/learning/learning-catalog.ts";
import type { LearningTopicLabels } from "../../../../apps/web/src/features/workspace/learning/types.ts";

const labels: LearningTopicLabels = {
  [LEARNING_TOPIC.PSYCHOLOGY]: "Психологія",
  [LEARNING_TOPIC.RISK_MANAGEMENT]: "Ризик-менеджмент",
  [LEARNING_TOPIC.TRADING_STRATEGY]: "Торгова стратегія",
  [LEARNING_TOPIC.PRICE_ACTION]: "Прайс-екшн",
  [LEARNING_TOPIC.PRICE_BEHAVIOR]: "Поведінка ціни",
  [LEARNING_TOPIC.TRADE_EXECUTION]: "Виконання угод",
  [LEARNING_TOPIC.BACKTESTING]: "Бектести та статистика",
  [LEARNING_TOPIC.MACROECONOMICS]: "Макроекономіка та новини",
  [LEARNING_TOPIC.GENERAL]: "Загальне",
};

const older: LearningEntry = {
  id: crypto.randomUUID(),
  revision: 1,
  kind: LEARNING_KIND.LESSON,
  updatedAt: "2026-11-23T10:00:00Z",
  title: "Price study",
  body: "",
  completed: false,
  author: "Price Action Community",
  topic: LEARNING_TOPIC.PRICE_ACTION,
  blocks: [
    {
      id: crypto.randomUUID(),
      type: LECTURE_BLOCK.TEXT,
      text: "Opening range",
    },
  ],
};
const recent: LearningEntry = {
  ...older,
  id: crypto.randomUUID(),
  updatedAt: "2026-11-26T10:00:00Z",
  title: "Sizing",
  author: "price action community",
  topic: LEARNING_TOPIC.RISK_MANAGEMENT,
};
const untagged: LearningEntry = {
  ...older,
  id: crypto.randomUUID(),
  updatedAt: "2026-11-24T10:00:00Z",
  title: "Legacy entry",
  author: undefined,
  topic: undefined,
};
const entries = [older, recent, untagged];
const newest = { search: "", sort: LEARNING_DATE_ORDER.NEWEST } as const;

test("combines topic and author filters with text from lecture blocks and localized labels", () => {
  const authors = learningNameOptions(entries.map(({ author }) => author));
  expect(authors).toEqual([
    { key: "price action community", label: "Price Action Community" },
  ]);
  expect(
    filterLearningEntries(
      entries,
      {
        ...newest,
        author: authors[0].key,
        topic: LEARNING_TOPIC.PRICE_ACTION,
        search: "Opening RANGE",
      },
      labels,
    ),
  ).toEqual([older]);
  expect(
    filterLearningEntries(
      entries,
      { ...newest, search: "ризик-менеджмент" },
      labels,
    ),
  ).toEqual([recent]);
});

test("includes records without tags when unfiltered and sorts by update time in both directions", () => {
  expect(filterLearningEntries(entries, newest, labels)).toEqual([
    recent,
    untagged,
    older,
  ]);
  expect(
    filterLearningEntries(
      entries,
      { ...newest, sort: LEARNING_DATE_ORDER.OLDEST },
      labels,
    ),
  ).toEqual([older, untagged, recent]);
  expect(entries).toEqual([older, recent, untagged]);
});
