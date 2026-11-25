import type { LECTURE_BLOCK } from "@liquidation/domain/workspace/constants";
import type {
  LearningEntry,
  LearningKind,
  LectureBlock,
} from "@liquidation/domain/workspace/types";
import type { PAGE_VIEW } from "../../../app/constants.ts";
import type { ScreenshotDraft } from "../../../shared/screenshots/types.ts";

export type LearningPageProps = {
  kind: LearningKind;
  view:
    | typeof PAGE_VIEW.LIST
    | typeof PAGE_VIEW.NEW
    | typeof PAGE_VIEW.DETAILS
    | typeof PAGE_VIEW.EDIT;
  id?: string;
};

export type LearningEditorProps = {
  kind: LearningKind;
  entry?: LearningEntry;
  groups: string[];
};

export type LectureDraft =
  | Extract<LectureBlock, { type: typeof LECTURE_BLOCK.TEXT }>
  | (Omit<
      Extract<LectureBlock, { type: typeof LECTURE_BLOCK.IMAGE }>,
      "screenshotIds"
    > & { images: ScreenshotDraft[] });

export type LectureBlocksProps = {
  blocks: LectureDraft[];
  onChange: (update: (blocks: LectureDraft[]) => LectureDraft[]) => void;
  disabled: boolean;
};
