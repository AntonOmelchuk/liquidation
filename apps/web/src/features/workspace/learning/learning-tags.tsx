import type { LearningEntry } from "@liquidation/domain/workspace/types";
import { useLearningMessages } from "./messages.ts";

export function LearningTags({ entry }: { entry: LearningEntry }) {
  const l = useLearningMessages();
  const { topic, author } = entry;
  if (!topic && !author) return null;
  return (
    <span className="learning-tags">
      {topic && (
        <span
          className="learning-tag learning-tag-topic"
          data-topic={topic}
          title={l.topic}
        >
          {l.topics[topic]}
        </span>
      )}
      {author && (
        <span className="learning-tag" title={l.author}>
          {author}
        </span>
      )}
    </span>
  );
}
