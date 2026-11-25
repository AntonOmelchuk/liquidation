import { z } from "zod";
import { screenshotIdsSchema } from "../evidence/screenshots.ts";
import { instrumentSymbolSchema } from "../instruments/symbol.ts";
import { PLAN_NARRATIVES } from "../plans/constants.ts";
import { missedOutcomeSchema } from "../plans/plan.ts";
import { TRADE_SIDE } from "../trades/constants.ts";
import {
  MISSED_REASONS,
  PERIOD,
  WATCH_OUTCOMES,
  WATCHLIST_LIMIT,
  WORKSPACE_TEXT_LIMIT,
} from "./constants.ts";
import { periodBounds } from "./period.ts";

const text = z.string().trim().max(WORKSPACE_TEXT_LIMIT);
const revision = z.number().int().positive();

export const thoughtInputSchema = z
  .object({
    text,
    screenshotIds: screenshotIdsSchema,
  })
  .refine(
    ({ text, screenshotIds }) => Boolean(text || screenshotIds.length),
    "Write a thought or attach a chart.",
  );

const watchItemSchema = z.object({
  symbol: instrumentSymbolSchema,
  narrative: z.enum(PLAN_NARRATIVES),
  notes: text,
  planIds: z
    .array(z.uuid())
    .max(WATCHLIST_LIMIT)
    .refine((ids) => new Set(ids).size === ids.length),
  outcome: z.enum(WATCH_OUTCOMES),
  review: text,
  screenshotIds: screenshotIdsSchema,
});

export const watchlistInputSchema = z.object({
  outlook: text,
  review: text,
  items: z
    .array(watchItemSchema)
    .max(WATCHLIST_LIMIT)
    .refine(
      (items) =>
        new Set(items.map(({ symbol }) => symbol)).size === items.length,
      "A symbol can appear once per week.",
    ),
});

export const missedInputSchema = z
  .object({
    symbol: instrumentSymbolSchema,
    direction: z.enum(TRADE_SIDE),
    missedAt: z.iso.datetime(),
    reason: z.enum(MISSED_REASONS),
    notes: text,
    planId: z.uuid().optional(),
    outcome: missedOutcomeSchema.nullable(),
    screenshotIds: screenshotIdsSchema,
  })
  .refine(
    ({ missedAt, outcome }) =>
      !outcome || Date.parse(outcome.closedAt) >= Date.parse(missedAt),
    "The hypothetical exit precedes the missed entry.",
  );

export const thoughtSchema = thoughtInputSchema.safeExtend({
  day: z.iso.date(),
  revision,
});
export const watchlistSchema = watchlistInputSchema
  .extend({ start: z.iso.date(), revision })
  .refine(({ start }) => periodBounds(PERIOD.WEEK, start).start === start);
export const missedTradeSchema = missedInputSchema.safeExtend({
  id: z.uuid(),
  revision,
});
