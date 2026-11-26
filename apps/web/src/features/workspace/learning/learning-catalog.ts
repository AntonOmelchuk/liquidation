import { LECTURE_BLOCK } from "@liquidation/domain/workspace/constants";
import type { LearningEntry } from "@liquidation/domain/workspace/types";
import { LEARNING_DATE_ORDER } from "./constants.ts";
import type { LearningListFilters, LearningTopicLabels } from "./types.ts";

export function learningNameKey(name?: string) {
  return name?.trim().replace(/\s+/g, " ").toLowerCase() ?? "";
}

export function learningNameOptions(values: readonly (string | undefined)[]) {
  const names = new Map<string, string>();
  for (const label of values) {
    if (!label) continue;
    const key = learningNameKey(label);
    if (key && !names.has(key)) names.set(key, label);
  }
  return [...names]
    .map(([key, label]) => ({ key, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function searchableContent(entry: LearningEntry, topics: LearningTopicLabels) {
  const blocks =
    entry.blocks?.map((block) =>
      block.type === LECTURE_BLOCK.TEXT ? block.text : block.caption,
    ) ?? [];
  return [
    entry.title,
    entry.author,
    entry.topic ? topics[entry.topic] : undefined,
    entry.group,
    entry.body,
    ...blocks,
  ]
    .join(" ")
    .toLowerCase();
}

export function filterLearningEntries(
  entries: readonly LearningEntry[],
  { search, topic, author, sort }: LearningListFilters,
  topics: LearningTopicLabels,
) {
  const query = search.trim().toLowerCase();
  const direction = sort === LEARNING_DATE_ORDER.OLDEST ? 1 : -1;
  return entries
    .filter(
      (entry) =>
        (topic === undefined || entry.topic === topic) &&
        (author === undefined || learningNameKey(entry.author) === author) &&
        (!query || searchableContent(entry, topics).includes(query)),
    )
    .sort(
      (a, b) =>
        direction * (Date.parse(a.updatedAt) - Date.parse(b.updatedAt)) ||
        a.title.localeCompare(b.title) ||
        a.id.localeCompare(b.id),
    );
}
