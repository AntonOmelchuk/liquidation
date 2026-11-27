import { isJournalRoute } from "@liquidation/domain/journal/journal";
import { isMarketRoute } from "@liquidation/domain/market/contracts";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createJournal } from "../journal.ts";
import { createCalendarFeed } from "../market/calendar-feed.ts";
import { createQuoteReader } from "../market/quote-snapshot.ts";
import {
  createReactionHistory,
  startReactionCollection,
} from "../market/reaction-history.ts";
import { createReleaseReactionReader } from "../market/release-reaction.ts";
import { journalHandler } from "./journal-handler.ts";
import { marketHandler } from "./market-handler.ts";

export function localApiHandler() {
  const storage = createJournal();
  const journal = journalHandler(storage);
  const readCalendar = createCalendarFeed();
  const history = createReactionHistory({
    readCalendar,
    readReaction: createReleaseReactionReader(),
    readHistory: storage.readReleaseHistory,
    recordHistory: storage.recordReleaseHistory,
  });
  const market = marketHandler(
    readCalendar,
    createQuoteReader(),
    history.read,
    storage.readReleaseHistory,
  );

  function handle(request: IncomingMessage, response: ServerResponse) {
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
  }
  return { handle, start: () => startReactionCollection(history.collect) };
}
