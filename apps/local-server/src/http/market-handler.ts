import {
  HTTP_METHOD,
  HTTP_STATUS,
  MEDIA_TYPE,
} from "@liquidation/domain/journal/constants";
import { MARKET_ROUTES } from "@liquidation/domain/market/constants";
import {
  quoteSelectionSchema,
  releaseReactionQuerySchema,
} from "@liquidation/domain/market/contracts";
import type { IncomingMessage, ServerResponse } from "node:http";
import type {
  CalendarReader,
  QuoteReader,
  ReactionHistoryReader,
  ReleaseReactionRouteReader,
} from "../market/types.ts";
import { isLocalRequest } from "./local-request.ts";

export function marketHandler(
  readCalendar: CalendarReader,
  readQuotes: QuoteReader,
  readReaction: ReleaseReactionRouteReader,
  readHistory: ReactionHistoryReader,
) {
  return async (request: IncomingMessage, response: ServerResponse) => {
    function send(status: number, data: unknown) {
      if (response.destroyed) return;
      response.writeHead(status, {
        "Content-Type": MEDIA_TYPE.JSON,
        "Cache-Control": "no-store",
      });
      response.end(JSON.stringify(data));
    }

    if (!isLocalRequest(request)) {
      send(HTTP_STATUS.FORBIDDEN, { error: "Request origin is not allowed." });
      return;
    }
    if (request.method !== HTTP_METHOD.GET) {
      send(HTTP_STATUS.METHOD_NOT_ALLOWED, { error: "Method not allowed." });
      return;
    }

    const [path, search] = request.url?.split("?", 2) ?? [];
    if (path === MARKET_ROUTES.calendar) {
      send(HTTP_STATUS.OK, await readCalendar());
      return;
    }
    if (path === MARKET_ROUTES.reactions) {
      try {
        send(HTTP_STATUS.OK, await readHistory());
      } catch {
        send(HTTP_STATUS.INTERNAL_SERVER_ERROR, {
          error: "Could not read local news reactions.",
        });
      }
      return;
    }
    const query = new URLSearchParams(search);
    if (path === MARKET_ROUTES.reaction) {
      const input = releaseReactionQuerySchema.safeParse({
        symbol: query.get("symbol"),
        at: query.get("at"),
      });
      if (!input.success) {
        send(HTTP_STATUS.UNPROCESSABLE_CONTENT, {
          error: "Choose a supported symbol and release time.",
        });
        return;
      }
      const reaction = await readReaction(input.data, query.get("event")).catch(
        () => null,
      );
      if (reaction === null) {
        send(HTTP_STATUS.SERVICE_UNAVAILABLE, {
          error: "Candle history is temporarily unavailable.",
        });
        return;
      }
      send(HTTP_STATUS.OK, reaction);
      return;
    }
    const symbols = quoteSelectionSchema.safeParse(
      query.get("symbols")?.split(","),
    );

    if (!symbols.success || !symbols.data.length) {
      send(HTTP_STATUS.UNPROCESSABLE_CONTENT, {
        error: "Choose up to eight supported symbols.",
      });
      return;
    }
    const quotes = await readQuotes(symbols.data);
    if (quotes === null) {
      send(HTTP_STATUS.SERVICE_UNAVAILABLE, {
        error: "Quotes are temporarily unavailable.",
      });
      return;
    }
    send(HTTP_STATUS.OK, quotes);
  };
}
