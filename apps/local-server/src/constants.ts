import { MAX_SCREENSHOT_UPLOAD_BYTES } from "@liquidation/domain/evidence/constants";

export const LOCAL_HOST = "127.0.0.1";
export const LOCAL_PORT = 4173;
export const ROOT_PATH = "/";
export const INDEX_DOCUMENT = "/index.html";
export const SEC_FETCH_SITE = "sec-fetch-site";
export const CROSS_SITE = "cross-site";
export const FILE_ERROR = { NOT_FOUND: "ENOENT", EXISTS: "EEXIST" } as const;
export const RASTER_SIGNATURE = {
  PNG_HEADER: "IHDR",
  RIFF: "RIFF",
  WEBP: "WEBP",
} as const;

export const JOURNAL_JSON_LIMIT = 256 * 1024;
export const EVIDENCE_JSON_LIMIT = 1024 * 1024;
export const EVIDENCE_MULTIPART_LIMIT =
  MAX_SCREENSHOT_UPLOAD_BYTES + 2 * EVIDENCE_JSON_LIMIT;
