import { z } from "zod";
import { checklistSchema } from "../playbooks/playbook.ts";
import { POSITION_ACTION } from "./constants.ts";
import { tradeLinksSchema } from "./trade-links.ts";
import { tradeInput } from "./trade.ts";
import { validPriceGeometry } from "./prices.ts";
import { validMistakeReview } from "./mistakes.ts";
import {
  pnlCalculationSchema,
  riskPercentSchema,
  riskSizingSchema,
  validRiskSizing,
} from "./financials.ts";

export const positionInput = z
  .object({
    symbol: tradeInput.shape.symbol,
    direction: tradeInput.shape.direction,
    openedAt: tradeInput.shape.openedAt,
    risk: tradeInput.shape.risk,
    notes: tradeInput.shape.notes,
    ...tradeLinksSchema.shape,
  })
  .refine(validMistakeReview, {
    path: ["criticalMistakes"],
    message: "Critical mistakes must be recorded on the trade.",
  })
  .refine(({ direction, prices }) => validPriceGeometry(direction, prices), {
    path: ["prices"],
    message: "Check the initial stop, target and excursion prices.",
  });
export const positionSchema = positionInput
  .safeExtend({
    id: z.uuid(),
    revision: z.number().int().positive(),
    riskSizing: riskSizingSchema.optional(),
  })
  .refine(validRiskSizing, {
    path: ["risk"],
    message: "Risk does not match the saved entry balance.",
  });

const positionEntryInput = positionInput.safeExtend({
  riskPercent: riskPercentSchema.nullable().optional(),
});

export const positionCommand = z.discriminatedUnion("action", [
  z.object({
    action: z.literal(POSITION_ACTION.OPEN),
    input: positionEntryInput,
  }),
  z.object({
    action: z.literal(POSITION_ACTION.EDIT),
    id: z.uuid(),
    revision: z.number().int().positive(),
    input: positionEntryInput,
  }),
  z.object({
    action: z.literal(POSITION_ACTION.CLOSE),
    id: z.uuid(),
    revision: z.number().int().positive(),
    input: z.object({
      closedAt: tradeInput.shape.closedAt,
      profit: tradeInput.shape.profit,
      commission: tradeInput.shape.commission,
      swap: tradeInput.shape.swap,
      management: checklistSchema.optional(),
      links: tradeLinksSchema.optional(),
      pnlCalculation: pnlCalculationSchema.optional(),
    }),
  }),
]);
