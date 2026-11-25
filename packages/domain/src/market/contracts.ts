import { z } from "zod";
import {
  CALENDAR_SOURCE,
  CALENDAR_STATE,
  CANDLE_INTERVAL,
  MARKET_IMPACT,
  MARKET_ROUTES,
  MAX_QUOTE_SYMBOLS,
  QUOTE_SYMBOLS,
} from "./constants.ts";

const symbolSet = new Set(QUOTE_SYMBOLS);
export const quoteSymbolSchema = z
  .string()
  .refine((value) => symbolSet.has(value));
export const quoteSelectionSchema = z
  .array(quoteSymbolSchema)
  .max(MAX_QUOTE_SYMBOLS)
  .refine((symbols) => new Set(symbols).size === symbols.length);

export const marketImpactSchema = z.union([
  z.literal(MARKET_IMPACT.LOW),
  z.literal(MARKET_IMPACT.MEDIUM),
  z.literal(MARKET_IMPACT.HIGH),
]);

const eventSchema = z.object({
  id: z.string(),
  name: z.string(),
  currency: z.string(),
  at: z.iso.datetime(),
  timeKnown: z.boolean(),
  impact: marketImpactSchema,
  actual: z.string(),
  forecast: z.string(),
  previous: z.string(),
});

export const calendarFeedSchema = z.object({
  source: z.enum(CALENDAR_SOURCE),
  state: z.enum(CALENDAR_STATE),
  fetchedAt: z.iso.datetime().nullable(),
  events: z.array(eventSchema),
});

export const quoteSchema = z.object({
  symbol: quoteSymbolSchema,
  price: z.number().positive(),
  at: z.iso.datetime(),
  stale: z.boolean(),
  closed: z.boolean(),
  changePercent: z.number().optional(),
});

export const quoteSnapshotSchema = z.array(quoteSchema).max(MAX_QUOTE_SYMBOLS);

export const releaseReactionQuerySchema = z.object({
  symbol: quoteSymbolSchema,
  at: z.iso.datetime(),
});

const observedPrice = z.number().positive().nullable();

export const releaseReactionSchema = releaseReactionQuerySchema.extend({
  interval: z.enum(CANDLE_INTERVAL).nullable(),
  before: observedPrice,
  closes: z.tuple([observedPrice, observedPrice]),
});

export function isMarketRoute(path?: string) {
  return (
    path === MARKET_ROUTES.calendar ||
    path === MARKET_ROUTES.quotes ||
    path === MARKET_ROUTES.reaction
  );
}
