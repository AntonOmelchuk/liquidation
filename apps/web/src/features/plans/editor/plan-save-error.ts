import { HTTP_STATUS } from "@liquidation/domain/journal/constants";
import { SCREENSHOT_ERROR } from "../../../shared/screenshots/constants.ts";
import { JournalRequestError } from "../../journal/data/api.ts";

export function planSaveError(error: unknown) {
  if (error instanceof JournalRequestError) {
    if (error.status === HTTP_STATUS.CONFLICT) return "conflict";
    if (error.status === HTTP_STATUS.CONTENT_TOO_LARGE)
      return SCREENSHOT_ERROR.UPLOAD_LIMIT;
    if (error.status === HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE)
      return "invalidPhoto";
  }
  return "saveError";
}
