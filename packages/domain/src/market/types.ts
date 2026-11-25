import type { z } from "zod";
import type {
  calendarFeedSchema,
  quoteSchema,
  quoteSnapshotSchema,
  releaseReactionQuerySchema,
  releaseReactionSchema,
} from "./contracts.ts";

export type CalendarFeed = z.infer<typeof calendarFeedSchema>;
export type CalendarEvent = CalendarFeed["events"][number];
export type Quote = z.infer<typeof quoteSchema>;
export type QuoteSnapshot = z.infer<typeof quoteSnapshotSchema>;

export type ReleaseReactionQuery = z.infer<typeof releaseReactionQuerySchema>;
export type ReleaseReaction = z.infer<typeof releaseReactionSchema>;
export type ReactionInterval = NonNullable<ReleaseReaction["interval"]>;
