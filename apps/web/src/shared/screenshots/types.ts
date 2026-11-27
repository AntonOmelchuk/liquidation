import type { SCREENSHOT_ERROR } from "./constants.ts";

export type ScreenshotFieldProps = {
  value: readonly ScreenshotDraft[];
  onChange: (next: ScreenshotDraft[]) => void;
  disabled?: boolean;
};

export type ScreenshotDraft = { id: string; file?: File };

export type ScreenshotError =
  | typeof SCREENSHOT_ERROR.TOO_MANY
  | typeof SCREENSHOT_ERROR.INVALID_FILE
  | typeof SCREENSHOT_ERROR.UPLOAD_LIMIT;

export type ScreenshotPreviewProps = {
  shot: ScreenshotDraft;
  number: number;
};

export type ScreenshotGalleryProps = { ids?: readonly string[] };

export type ScreenshotDialogProps = {
  source: string;
  title: string;
  onClose: () => void;
};
