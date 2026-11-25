import { isJournalRoute } from "@liquidation/domain/journal/journal";
import { isMarketRoute } from "@liquidation/domain/market/contracts";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createCalendarFeed } from "../market/calendar-feed.ts";
import { createQuoteReader } from "../market/quote-snapshot.ts";
import { createReleaseReactionReader } from "../market/release-reaction.ts";
import { journalHandler } from "./journal-handler.ts";
import { marketHandler } from "./market-handler.ts";

export function localApiHandler() {
  const journal = journalHandler();
  const market = marketHandler(
    createCalendarFeed(),
    createQuoteReader(),
    createReleaseReactionReader(),
  );

  return (request: IncomingMessage, response: ServerResponse) => {
    const path = request.url?.split("?", 1)[0];
    if (isJournalRoute(path)) {
      void journal(request, response);
      return true;
    }
    if (isMarketRoute(path)) {
      void market(request, response);
      return true;
    }
    return false;
  };
}
