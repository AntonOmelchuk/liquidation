import type {
  CalendarEvent,
  CalendarFeed,
  QuoteSnapshot,
  ReleaseReaction,
  ReleaseReactionQuery,
} from "@liquidation/domain/market/types";

export type MarketFeedOptions = {
  request?: typeof fetch;
  now?: () => number;
};

export type CalendarParser = (payload: unknown) => CalendarEvent[];
export type CalendarReader = () => Promise<CalendarFeed>;
export type QuoteReader = (
  symbols: readonly string[],
) => Promise<QuoteSnapshot | null>;

export type ReleaseReactionReader = (
  query: ReleaseReactionQuery,
) => Promise<ReleaseReaction | null>;
export type ReactionCacheEntry = {
  response: ReleaseReaction;
  expiresAt: number;
};
