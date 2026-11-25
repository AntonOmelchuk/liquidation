import { screenshotIdsSchema } from "../evidence/screenshots.ts";
import type { TradeLinks } from "./types.ts";

export const tradeEvidenceShape = {
  entryScreenshotIds: screenshotIdsSchema.optional(),
  exitScreenshotIds: screenshotIdsSchema.optional(),
};

export function tradeScreenshotIds(record?: TradeLinks) {
  return new Set([
    ...(record?.entryScreenshotIds ?? []),
    ...(record?.exitScreenshotIds ?? []),
  ]);
}
