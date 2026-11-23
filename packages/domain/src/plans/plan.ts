import { z } from "zod";
import { screenshotIdsSchema } from "../evidence/screenshots.ts";
import { playbookReferenceSchema } from "../playbooks/playbook.ts";
import { TRADE_SIDE } from "../trades/constants.ts";
import { tradeInput } from "../trades/trade.ts";
import {
  MAX_PLAN_ANALYSIS_BLOCKS,
  PLAN_ACTION,
  PLAN_NARRATIVES,
  PLAN_STATUS,
} from "./constants.ts";
import {
  planAnalysisBlockSchema,
  planEventSchema,
  planNoteSchema,
} from "./plan-evidence.ts";

const price = z.number().optional();
export const planSetupSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    symbol: tradeInput.shape.symbol,
    direction: tradeInput.shape.direction,
    entryCondition: z.string().trim().min(1).max(4000),
    entry: price,
    stop: price,
    target: price,
    startsOn: z.iso.date().optional(),
    endsOn: z.iso.date().optional(),
    narrative: z.enum(PLAN_NARRATIVES).optional(),
    avoid: z.string().trim().max(4000).optional(),
    playbook: playbookReferenceSchema.optional(),
    analysis: z
      .array(planAnalysisBlockSchema)
      .max(MAX_PLAN_ANALYSIS_BLOCKS)
      .optional(),
    screenshotIds: screenshotIdsSchema.optional(),
  })
  .refine(
    ({ direction, entry, stop, target }) => {
      const before =
        direction === TRADE_SIDE.LONG
          ? (a: number, b: number) => a < b
          : (a: number, b: number) => a > b;
      return (
        (stop === undefined || entry === undefined || before(stop, entry)) &&
        (entry === undefined ||
          target === undefined ||
          before(entry, target)) &&
        (stop === undefined || target === undefined || before(stop, target))
      );
    },
    {
      path: ["entry"],
      message: "Entry, stop and target must match the plan direction.",
    },
  )
  .refine(
    ({ startsOn, endsOn }) =>
      !endsOn || Boolean(startsOn && endsOn >= startsOn),
    {
      path: ["endsOn"],
      message: "The end date must be on or after the start date.",
    },
  )
  .refine(
    ({ analysis }) =>
      !analysis ||
      new Set(analysis.map(({ id }) => id)).size === analysis.length,
    {
      path: ["analysis"],
      message: "Analysis blocks must have distinct IDs.",
    },
  );

export const planReviewSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal(PLAN_STATUS.WAITING) }),
  z.object({ status: z.literal(PLAN_STATUS.IN_PROGRESS) }),
  z.object({ status: z.literal(PLAN_STATUS.WORKED) }),
  z.object({
    status: z.literal(PLAN_STATUS.FAILED),
    reason: z.string().trim().min(1).max(4000),
  }),
  z.object({
    status: z.literal(PLAN_STATUS.MISSED),
    outcome: z
      .object({
        closedAt: z.iso.datetime(),
        netR: z
          .number()
          .gte(-Number.MAX_SAFE_INTEGER)
          .lte(Number.MAX_SAFE_INTEGER),
        risk: tradeInput.shape.risk.unwrap().optional(),
      })
      .refine(
        ({ netR, risk }) =>
          risk === undefined ||
          Number.isSafeInteger(
            Math.round(Math.abs(netR) * Math.round(risk * 100)),
          ),
        {
          path: ["risk"],
          message: "The estimated monetary result is out of range.",
        },
      )
      .nullable(),
  }),
]);

const planIdentity = {
  id: z.uuid(),
  revision: z.number().int().positive(),
};

export const planSchema = z.object({
  ...planIdentity,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  setup: planSetupSchema,
  originalSetup: planSetupSchema.optional(),
  review: planReviewSchema,
  recap: planNoteSchema.optional(),
  events: z.array(planEventSchema).optional(),
});

export const planTradeChangeSchema = z.object({
  id: z.uuid(),
  previousPlanId: z.uuid().nullable(),
  attached: z.boolean(),
});
const tradeChanges = z
  .array(planTradeChangeSchema)
  .refine(
    (changes) => new Set(changes.map(({ id }) => id)).size === changes.length,
  )
  .optional();

export const planCommand = z.discriminatedUnion("action", [
  z.object({
    action: z.literal(PLAN_ACTION.CREATE),
    id: z.uuid(),
    setup: planSetupSchema,
    review: planReviewSchema.optional(),
    tradeChanges,
  }),
  z.object({
    action: z.literal(PLAN_ACTION.EDIT),
    ...planIdentity,
    setup: planSetupSchema,
    review: planReviewSchema,
    recap: planNoteSchema.nullish(),
    tradeChanges,
  }),
  z.object({
    action: z.literal(PLAN_ACTION.ADD_UPDATE),
    ...planIdentity,
    eventId: z.uuid(),
    note: planNoteSchema,
  }),
  z.object({
    action: z.literal(PLAN_ACTION.EDIT_UPDATE),
    ...planIdentity,
    eventId: z.uuid(),
    note: planNoteSchema,
  }),
  z.object({
    action: z.literal(PLAN_ACTION.VOID),
    ...planIdentity,
    reason: z.string().trim().min(1).max(4000),
  }),
  z.object({ action: z.literal(PLAN_ACTION.RESTORE), ...planIdentity }),
]);
