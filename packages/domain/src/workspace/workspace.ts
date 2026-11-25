import { z } from "zod";
import { screenshotIdsSchema } from "../evidence/screenshots.ts";
import { instrumentSymbolSchema } from "../instruments/symbol.ts";
import {
  ASSESSMENT_LIMIT,
  PERIOD,
  PERIODS,
  PREPARATION_PERIODS,
  TASK_LIMIT,
  TASK_TEXT_LIMIT,
  WORKSPACE_RECORD,
  WORKSPACE_TEXT_LIMIT,
  WORKSPACE_TITLE_LIMIT,
} from "./constants.ts";
import { learningSchema } from "./learning.ts";
import {
  missedInputSchema,
  missedTradeSchema,
  thoughtInputSchema,
  thoughtSchema,
  watchlistInputSchema,
  watchlistSchema,
} from "./planning.ts";
import { periodBounds } from "./period.ts";

const text = z.string().trim().max(WORKSPACE_TEXT_LIMIT);
const grade = z.string().trim().max(20);
export const workspaceDaySchema = z.iso.date();
const preparationKey = {
  kind: z.enum(PREPARATION_PERIODS),
  start: workspaceDaySchema,
};
const reportKey = { kind: z.enum(PERIODS), start: workspaceDaySchema };
const uniqueIds = (rows: { id: string }[]) =>
  new Set(rows.map(({ id }) => id)).size === rows.length;
const task = z.object({
  id: z.uuid(),
  text: z.string().trim().min(1).max(TASK_TEXT_LIMIT),
  done: z.boolean(),
});
const preparation = z.object({
  outlook: text,
  news: text,
  alerts: text,
  watch: text,
  study: text,
  tasks: z.array(task).max(TASK_LIMIT).refine(uniqueIds),
});
const assessment = z.object({
  id: z.uuid(),
  grade,
  note: z.string().trim().max(1000),
});
const report = z.object({
  grade,
  quality: grade,
  progress: z.number().int().min(1).max(10).optional(),
  focus: text,
  process: text,
  learned: text,
  errors: text,
  best: text,
  overview: text,
  missed: text,
  lesson: text,
  next: text,
  bestTradeId: z.uuid().optional(),
  assessments: z.array(assessment).max(ASSESSMENT_LIMIT).refine(uniqueIds),
  screenshotIds: screenshotIdsSchema.optional(),
  writtenPnl: z
    .number()
    .min(-1_000_000_000)
    .max(1_000_000_000)
    .multipleOf(0.01)
    .optional(),
});
const highlight = z.object({
  featured: z.boolean(),
  note: text,
  example: z
    .object({
      title: z.string().trim().min(1).max(WORKSPACE_TITLE_LIMIT),
      symbol: instrumentSymbolSchema.optional(),
    })
    .optional(),
  screenshotIds: screenshotIdsSchema.optional(),
});
const revision = z.number().int().positive();
const periodStart = ({
  kind,
  start,
}: {
  kind: Parameters<typeof periodBounds>[0];
  start: string;
}) => periodBounds(kind, start).start === start;

export const workspaceSchema = z.object({
  preparations: z
    .array(
      preparation.extend({ ...preparationKey, revision }).refine(periodStart),
    )
    .default([]),
  reports: z
    .array(report.extend({ ...reportKey, revision }).refine(periodStart))
    .default([]),
  learning: z
    .array(
      learningSchema.safeExtend({
        id: z.uuid(),
        revision,
        updatedAt: z.iso.datetime(),
      }),
    )
    .default([]),
  highlights: z.array(highlight.extend({ id: z.uuid(), revision })).default([]),
  thoughts: z.array(thoughtSchema).default([]),
  watchlists: z.array(watchlistSchema).default([]),
  missedTrades: z.array(missedTradeSchema).default([]),
});

export const workspaceCommand = z.discriminatedUnion("record", [
  z.object({
    record: z.literal(WORKSPACE_RECORD.THOUGHT),
    day: workspaceDaySchema,
    revision: revision.optional(),
    input: thoughtInputSchema,
  }),
  z
    .object({
      record: z.literal(WORKSPACE_RECORD.WATCHLIST),
      start: workspaceDaySchema,
      revision: revision.optional(),
      input: watchlistInputSchema,
    })
    .refine(({ start }) => periodBounds(PERIOD.WEEK, start).start === start),
  z.object({
    record: z.literal(WORKSPACE_RECORD.MISSED),
    id: z.uuid(),
    revision: revision.optional(),
    input: missedInputSchema,
  }),
  z
    .object({
      record: z.literal(WORKSPACE_RECORD.PREPARATION),
      ...preparationKey,
      revision: revision.optional(),
      input: preparation,
    })
    .refine(periodStart),
  z
    .object({
      record: z.literal(WORKSPACE_RECORD.REPORT),
      ...reportKey,
      revision: revision.optional(),
      input: report,
    })
    .refine(periodStart),
  z.object({
    record: z.literal(WORKSPACE_RECORD.LEARNING),
    id: z.uuid(),
    revision: revision.optional(),
    input: learningSchema,
  }),
  z.object({
    record: z.literal(WORKSPACE_RECORD.HIGHLIGHT),
    id: z.uuid(),
    revision: revision.optional(),
    input: highlight,
  }),
]);
