import { LECTURE_BLOCK } from "@liquidation/domain/workspace/constants";
import type {
  LearningEntry,
  LectureBlock,
} from "@liquidation/domain/workspace/types";
import { existingScreenshots } from "../../../shared/screenshots/draft.ts";
import type { LectureDraft } from "./types.ts";

export function textDraft(text = ""): LectureDraft {
  return { id: crypto.randomUUID(), type: LECTURE_BLOCK.TEXT, text };
}

export function lectureDraft(entry?: LearningEntry): LectureDraft[] {
  const blocks: LectureDraft[] = (entry?.blocks ?? []).map((block) =>
    block.type === LECTURE_BLOCK.TEXT
      ? block
      : {
          id: block.id,
          type: block.type,
          caption: block.caption,
          images: existingScreenshots(block.screenshotIds),
        },
  );
  if (entry?.body) blocks.unshift(textDraft(entry.body));
  return blocks.length ? blocks : [textDraft()];
}

export function lectureBlocksToSave(drafts: LectureDraft[]): LectureBlock[] {
  return drafts.flatMap<LectureBlock>((block) => {
    if (block.type === LECTURE_BLOCK.TEXT)
      return block.text.trim() ? [block] : [];
    const { images, ...rest } = block;
    return images.length || block.caption.trim()
      ? [{ ...rest, screenshotIds: images.map(({ id }) => id) }]
      : [];
  });
}
