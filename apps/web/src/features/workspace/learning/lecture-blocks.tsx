import { ICON_ACTION } from "../../../shared/ui/constants.ts";
import { IconAction } from "../../../shared/ui/icon-action.tsx";
import {
  LECTURE_BLOCK,
  LECTURE_BLOCK_LIMIT,
  LECTURE_CAPTION_LIMIT,
  WORKSPACE_TEXT_LIMIT,
} from "@liquidation/domain/workspace/constants";
import type { LearningEntry } from "@liquidation/domain/workspace/types";
import { ScreenshotField } from "../../../shared/screenshots/screenshot-field.tsx";
import { ScreenshotGallery } from "../../../shared/screenshots/screenshot-gallery.tsx";
import { textDraft } from "./lecture-content.ts";
import { useLearningMessages } from "./messages.ts";
import type { LectureBlocksProps, LectureDraft } from "./types.ts";

export function LectureBlocks({
  blocks,
  onChange,
  disabled,
}: LectureBlocksProps) {
  const l = useLearningMessages();

  function replace(block: LectureDraft) {
    onChange((current) =>
      current.map((item) => (item.id === block.id ? block : item)),
    );
  }

  function move(id: string, offset: number) {
    onChange((current) => {
      const index = current.findIndex((block) => block.id === id);
      const destination = index + offset;
      if (index < 0 || destination < 0 || destination >= current.length)
        return current;
      const next = [...current];
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
  }

  function add(block: LectureDraft) {
    onChange((current) =>
      current.length < LECTURE_BLOCK_LIMIT ? [...current, block] : current,
    );
  }

  return (
    <div className="lecture-blocks">
      {blocks.map((block, index) => (
        <section key={block.id} className="lecture-block">
          <div className="lecture-block-bar">
            <h3>{l[block.type]}</h3>
            <div className="workspace-actions">
              <button
                className="secondary"
                type="button"
                aria-label={l.earlier + " · " + (index + 1)}
                disabled={index === 0}
                onClick={() => move(block.id, -1)}
              >
                ↑
              </button>
              <button
                className="secondary"
                type="button"
                aria-label={l.later + " · " + (index + 1)}
                disabled={index === blocks.length - 1}
                onClick={() => move(block.id, 1)}
              >
                ↓
              </button>
              <IconAction
                icon={ICON_ACTION.DELETE}
                label={l.removeBlock + " · " + (index + 1)}
                onClick={() =>
                  onChange((current) =>
                    current.filter(({ id }) => id !== block.id),
                  )
                }
              />
            </div>
          </div>
          {block.type === LECTURE_BLOCK.TEXT ? (
            <textarea
              aria-label={l.text + " · " + (index + 1)}
              rows={7}
              value={block.text}
              maxLength={WORKSPACE_TEXT_LIMIT}
              onChange={(event) =>
                replace({ ...block, text: event.target.value })
              }
            />
          ) : (
            <>
              <ScreenshotField
                value={block.images}
                disabled={disabled}
                onChange={(images) => replace({ ...block, images })}
              />
              <label>
                {l.caption}
                <input
                  value={block.caption}
                  maxLength={LECTURE_CAPTION_LIMIT}
                  onChange={(event) =>
                    replace({ ...block, caption: event.target.value })
                  }
                />
              </label>
            </>
          )}
        </section>
      ))}
      <div className="workspace-actions">
        <button
          className="secondary"
          type="button"
          disabled={blocks.length >= LECTURE_BLOCK_LIMIT}
          onClick={() => add(textDraft())}
        >
          ＋ {l.addText}
        </button>
        <button
          className="secondary"
          type="button"
          disabled={blocks.length >= LECTURE_BLOCK_LIMIT}
          onClick={() =>
            add({
              id: crypto.randomUUID(),
              type: LECTURE_BLOCK.IMAGE,
              images: [],
              caption: "",
            })
          }
        >
          ＋ {l.addImage}
        </button>
      </div>
    </div>
  );
}

export function LectureDocument({ entry }: { entry: LearningEntry }) {
  return (
    <div className="lecture-document">
      {entry.body && <p className="record-prose">{entry.body}</p>}
      {entry.blocks?.map((block) =>
        block.type === LECTURE_BLOCK.TEXT ? (
          <p key={block.id} className="record-prose">
            {block.text}
          </p>
        ) : (
          <figure key={block.id} className="lecture-image-block">
            <ScreenshotGallery ids={block.screenshotIds} />
            {block.caption && <figcaption>{block.caption}</figcaption>}
          </figure>
        ),
      )}
    </div>
  );
}
