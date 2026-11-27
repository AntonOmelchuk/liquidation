import type {
  CalendarEvent,
  CalendarFeed,
  QuoteSnapshot,
  ReleaseObservation,
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

export type ReactionHistoryReader = () => Promise<ReleaseObservation[]>;
export type ReactionHistoryOptions = {
  readCalendar: CalendarReader;
  readReaction: ReleaseReactionReader;
  readHistory: ReactionHistoryReader;
  recordHistory: (observations: readonly ReleaseObservation[]) => Promise<void>;
  now?: () => number;
};
export type ReactionCollectionGroup = {
  query: ReleaseReactionQuery;
  events: CalendarEvent[];
};
export type ReleaseReactionRouteReader = (
  query: ReleaseReactionQuery,
  eventId: string | null,
) => Promise<ReleaseReaction | null>;
