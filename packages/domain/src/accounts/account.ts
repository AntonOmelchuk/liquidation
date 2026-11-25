import { z } from "zod";
import { moneySchema } from "../shared/money.ts";
import {
  ACCOUNT_KIND,
  ACCOUNT_RECORD,
  DEFAULT_ACCOUNT_TIME_ZONE,
  DEFAULT_FIRM_DAY_START,
  LIMIT_UNIT,
  MAX_ACCOUNT_NAME_LENGTH,
  MAX_ACCOUNT_TEXT_LENGTH,
  MAX_LOSS_MODE,
  MOVEMENT_KIND,
} from "./constants.ts";

export const currencySchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/);
const limitSchema = z.discriminatedUnion("unit", [
  z.object({
    unit: z.literal(LIMIT_UNIT.MONEY),
    value: moneySchema.positive(),
  }),
  z.object({
    unit: z.literal(LIMIT_UNIT.PERCENT),
    value: z.number().positive().max(100),
  }),
]);

const timeZoneSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .refine((zone) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: zone });
      return true;
    } catch {
      return false;
    }
  }, "Use a recognized IANA time zone.");

export const accountRulesSchema = z
  .object({
    dailyLimit: limitSchema.optional(),
    countClosed: z.boolean().default(true),
    countOpenRisk: z.boolean().default(true),
    maxLoss: limitSchema.optional(),
    maxLossMode: z.enum(MAX_LOSS_MODE).default(MAX_LOSS_MODE.STATIC),
    target: limitSchema.optional(),
    minimumDays: z.number().int().positive().max(10000).optional(),
    timeZone: timeZoneSchema.default(DEFAULT_ACCOUNT_TIME_ZONE),
    dayStart: z.iso.time({ precision: -1 }).default(DEFAULT_FIRM_DAY_START),
  })
  .refine(
    ({ dailyLimit, countClosed, countOpenRisk }) =>
      !dailyLimit || countClosed || countOpenRisk,
    "Select the components counted towards daily loss.",
  );

export const accountInputSchema = z.object({
  name: z.string().trim().min(1).max(MAX_ACCOUNT_NAME_LENGTH),
  firm: z.string().trim().max(120),
  kind: z.enum(ACCOUNT_KIND),
  currency: currencySchema,
  startingBalance: moneySchema.nonnegative(),
  archived: z.boolean(),
  notes: z.string().trim().max(MAX_ACCOUNT_TEXT_LENGTH),
  rules: accountRulesSchema.optional(),
});

const revision = z.number().int().positive();

export const accountSchema = accountInputSchema.extend({
  id: z.uuid(),
  revision,
});

export const movementInputSchema = z
  .object({
    accountId: z.uuid(),
    kind: z.enum(MOVEMENT_KIND),
    amount: moneySchema,
    at: z.iso.datetime(),
    notes: z.string().trim().max(MAX_ACCOUNT_TEXT_LENGTH),
  })
  .refine(
    ({ kind, amount }) =>
      kind === MOVEMENT_KIND.DEPOSIT
        ? amount > 0
        : kind === MOVEMENT_KIND.CORRECTION
          ? amount !== 0
          : amount < 0,
    "Movement amount has the wrong sign.",
  );

export const movementSchema = movementInputSchema.safeExtend({
  id: z.uuid(),
  revision,
});

export const accountCommandSchema = z.discriminatedUnion("record", [
  z.object({
    record: z.literal(ACCOUNT_RECORD.ACCOUNT),
    id: z.uuid(),
    revision: revision.optional(),
    input: accountInputSchema,
  }),
  z.object({
    record: z.literal(ACCOUNT_RECORD.MOVEMENT),
    id: z.uuid(),
    revision: revision.optional(),
    input: movementInputSchema,
  }),
]);
