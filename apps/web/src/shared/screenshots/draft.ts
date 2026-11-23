import {
  MAX_SCREENSHOT_BYTES,
  MAX_SCREENSHOT_UPLOAD_BYTES,
  MAX_SCREENSHOTS_PER_SECTION,
  SCREENSHOT_TYPES,
} from "@liquidation/domain/evidence/constants";
import { SCREENSHOT_ERROR } from "./constants.ts";
import type { ScreenshotDraft } from "./types.ts";

export function existingScreenshots(
  ids?: readonly string[],
): ScreenshotDraft[] {
  return ids?.map((id) => ({ id })) ?? [];
}

export function addScreenshots(
  previous: readonly ScreenshotDraft[],
  files: readonly File[],
) {
  if (previous.length + files.length > MAX_SCREENSHOTS_PER_SECTION) {
    return { error: SCREENSHOT_ERROR.TOO_MANY } as const;
  }
  const supported: readonly string[] = SCREENSHOT_TYPES;
  if (
    files.some(
      (file) =>
        !file.size ||
        file.size > MAX_SCREENSHOT_BYTES ||
        (file.type
          ? !supported.includes(file.type)
          : !/\.(png|jpe?g|webp|gif)$/i.test(file.name)),
    )
  ) {
    return { error: SCREENSHOT_ERROR.INVALID_FILE } as const;
  }

  return {
    screenshots: [
      ...previous,
      ...files.map((file) => ({ id: crypto.randomUUID(), file })),
    ],
  };
}

export function collectScreenshots(
  sections: readonly (readonly ScreenshotDraft[])[],
) {
  const files = new Map<string, File>();
  let size = 0;
  for (const section of sections) {
    for (const { id, file } of section) {
      if (file && !files.has(id)) {
        files.set(id, file);
        size += file.size;
      }
    }
  }
  return size > MAX_SCREENSHOT_UPLOAD_BYTES ? null : files;
}
