export const JOURNAL_ROUTES = {
  trades: "/api/trades",
  positions: "/api/positions",
  plans: "/api/plans",
  playbooks: "/api/playbooks",
  backtests: "/api/backtests",
  tradeLinks: "/api/trade-links",
  planScreenshot: "/api/plan-screenshots/",
} as const;
export const JOURNAL_VERSION = 1;

export const HTTP_METHOD = { GET: "GET", POST: "POST" } as const;
export const MEDIA_TYPE = {
  JSON: "application/json",
  MULTIPART: "multipart/form-data",
} as const;
export const MULTIPART_FIELD = {
  COMMAND: "command",
  SCREENSHOT_PREFIX: "shot:",
} as const;
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  CONTENT_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  UNPROCESSABLE_CONTENT: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;
