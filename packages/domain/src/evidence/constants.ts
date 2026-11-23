export const RASTER_TYPE = {
  PNG: "image/png",
  JPEG: "image/jpeg",
  WEBP: "image/webp",
  GIF: "image/gif",
} as const;
export const SCREENSHOT_TYPES = Object.values(RASTER_TYPE);
export const MAX_SCREENSHOT_BYTES = 8 * 1024 * 1024;
export const MAX_SCREENSHOT_UPLOAD_BYTES = 32 * 1024 * 1024;
export const MAX_SCREENSHOTS_PER_SECTION = 12;
