import { z } from "zod";
import { screenshotIdsSchema } from "../evidence/screenshots.ts";
import { playbookReferenceSchema } from "../playbooks/playbook.ts";
import { TRADE_SIDE } from "../trades/constants.ts";
import { tradeInput } from "../trades/trade.ts";
import { BACKTEST_ACTION } from "./constants.ts";
import type { BacktestPrices, BacktestSample } from "./types.ts";

export const backtestMetadataSchema = z.object({
  title: z.string().trim().min(1).max(120),
  thesis: z.string().trim().max(4000),
  playbook: playbookReferenceSchema.optional(),
});

const price = z.number().gte(-1e12).lte(1e12);
export const backtestSampleFieldsSchema = z.object({
  symbol: tradeInput.shape.symbol,
  direction: tradeInput.shape.direction,
  timeframe: tradeInput.shape.timeframe,
  openedAt: tradeInput.shape.openedAt,
  closedAt: tradeInput.shape.closedAt,
  entry: price,
  stop: price,
  exit: price,
  costsR: z.number().min(0).max(1e6),
  notes: tradeInput.shape.notes,
  screenshotIds: screenshotIdsSchema,
});
const backtestSampleInput = backtestSampleFieldsSchema
  .refine(
    ({ openedAt, closedAt }) => Date.parse(closedAt) >= Date.parse(openedAt),
    {
      path: ["closedAt"],
      message: "The exit must follow the entry.",
    },
  )
  .refine(
    ({ direction, entry, stop }) =>
      direction === TRADE_SIDE.LONG ? stop < entry : stop > entry,
    {
      path: ["stop"],
      message: "The stop must be on the loss side of the entry.",
    },
  )
  .refine(
    (sample) => Math.abs(sampleResult(sample)) <= Number.MAX_SAFE_INTEGER,
    {
      path: ["exit"],
      message: "The result in R is out of range.",
    },
  );

const sampleSchema = backtestSampleInput.safeExtend({ id: z.uuid() });
const identity = { id: z.uuid(), revision: z.number().int().positive() };
export const backtestSchema = backtestMetadataSchema.extend({
  ...identity,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  samples: z.array(sampleSchema),
});
export const backtestCommand = z.discriminatedUnion("action", [
  z.object({
    action: z.literal(BACKTEST_ACTION.CREATE),
    id: z.uuid(),
    metadata: backtestMetadataSchema,
  }),
  z.object({
    action: z.literal(BACKTEST_ACTION.EDIT),
    ...identity,
    metadata: backtestMetadataSchema,
  }),
  z.object({
    action: z.enum([BACKTEST_ACTION.ADD_SAMPLE, BACKTEST_ACTION.EDIT_SAMPLE]),
    ...identity,
    sample: sampleSchema,
  }),
]);

export function sampleResult({
  direction,
  entry,
  stop,
  exit,
  costsR,
}: BacktestPrices) {
  return (
    (direction === TRADE_SIDE.LONG ? exit - entry : entry - exit) /
      Math.abs(entry - stop) -
    costsR
  );
}

export function backtestResults(samples: readonly BacktestSample[]) {
  let wins = 0;
  let gains = 0;
  let losses = 0;
  for (const sample of samples) {
    const r = sampleResult(sample);
    if (r > 0) {
      wins++;
      gains += r;
    } else losses -= r;
  }
  return {
    count: samples.length,
    totalR: samples.length ? gains - losses : null,
    expectancyR: samples.length ? (gains - losses) / samples.length : null,
    winRate: samples.length ? wins / samples.length : null,
    profitFactor: losses > 0 ? gains / losses : gains > 0 ? Infinity : null,
  };
}
