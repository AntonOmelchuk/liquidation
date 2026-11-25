import { z } from "zod";
import { screenshotIdsSchema } from "../evidence/screenshots.ts";
import {
  LEARNING_KIND,
  LEARNING_KINDS,
  LECTURE_BLOCK,
  LECTURE_BLOCK_LIMIT,
  LECTURE_CAPTION_LIMIT,
  WORKSPACE_TEXT_LIMIT,
  WORKSPACE_TITLE_LIMIT,
} from "./constants.ts";
import type { LectureBlock } from "./types.ts";

const text = z.string().trim().max(WORKSPACE_TEXT_LIMIT);
const title = z.string().trim().min(1).max(WORKSPACE_TITLE_LIMIT);

export const lectureBlockSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.uuid(),
    type: z.literal(LECTURE_BLOCK.TEXT),
    text: text.min(1),
  }),
  z.object({
    id: z.uuid(),
    type: z.literal(LECTURE_BLOCK.IMAGE),
    caption: z.string().trim().max(LECTURE_CAPTION_LIMIT),
    screenshotIds: screenshotIdsSchema.min(1),
  }),
]);

const lectureBlocks = z
  .array(lectureBlockSchema)
  .max(LECTURE_BLOCK_LIMIT)
  .refine((blocks) => {
    const ids = blocks.map(({ id }) => id);
    const screenshots = lectureScreenshotIds(blocks);
    return (
      new Set(ids).size === ids.length &&
      new Set(screenshots).size === screenshots.length
    );
  }, "Lecture blocks and images must have distinct IDs.");

export const learningSchema = z
  .object({
    title,
    kind: z.enum(LEARNING_KINDS),
    body: text,
    group: z
      .string()
      .trim()
      .overwrite((value) => value.replace(/\s+/g, " "))
      .min(1)
      .max(WORKSPACE_TITLE_LIMIT)
      .optional(),
    blocks: lectureBlocks.optional(),
    link: z
      .url({ protocol: /^https?$/ })
      .max(2048)
      .optional(),
    completed: z.boolean(),
    archived: z.boolean(),
  })
  .refine(
    ({ kind, group, blocks }) =>
      kind === LEARNING_KIND.LESSON ||
      (group === undefined && blocks === undefined),
    "Only lectures have groups and content blocks.",
  );

export function lectureScreenshotIds(blocks?: readonly LectureBlock[]) {
  return (
    blocks?.flatMap((block) =>
      block.type === LECTURE_BLOCK.IMAGE ? block.screenshotIds : [],
    ) ?? []
  );
}
