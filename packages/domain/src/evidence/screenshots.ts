import { z } from "zod";
import { MAX_SCREENSHOTS_PER_SECTION } from "./constants.ts";

export const screenshotIdSchema = z.uuid();
export const screenshotIdsSchema = z
  .array(screenshotIdSchema)
  .max(MAX_SCREENSHOTS_PER_SECTION);
