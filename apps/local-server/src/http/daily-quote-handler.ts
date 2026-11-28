import {
  HTTP_METHOD,
  HTTP_STATUS,
  MEDIA_TYPE,
} from "@liquidation/domain/journal/constants";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createDailyQuoteReader } from "../inspiration/daily-quote.ts";
import { isLocalRequest } from "./local-request.ts";

export function dailyQuoteHandler(read = createDailyQuoteReader()) {
  return async (request: IncomingMessage, response: ServerResponse) => {
    if (!isLocalRequest(request)) {
      response.writeHead(HTTP_STATUS.FORBIDDEN).end();
      return;
    }
    if (request.method !== HTTP_METHOD.GET) {
      response.writeHead(HTTP_STATUS.METHOD_NOT_ALLOWED).end();
      return;
    }
    const quote = await read();
    if (response.destroyed) return;
    response.writeHead(HTTP_STATUS.OK, {
      "Content-Type": MEDIA_TYPE.JSON,
      "Cache-Control": "no-store",
    });
    response.end(JSON.stringify(quote));
  };
}
