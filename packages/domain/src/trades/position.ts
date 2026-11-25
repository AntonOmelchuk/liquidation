import { z } from "zod";
import { checklistSchema } from "../playbooks/playbook.ts";
import { POSITION_ACTION } from "./constants.ts";
import { tradeLinksSchema } from "./trade-links.ts";
import { tradeInput } from "./trade.ts";
import { validPriceGeometry } from "./prices.ts";
import { validMistakeReview } from "./mistakes.ts";

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
export const positionSchema = positionInput.safeExtend({
  id: z.uuid(),
  revision: z.number().int().positive(),
});

export const positionCommand = z.discriminatedUnion("action", [
  z.object({ action: z.literal(POSITION_ACTION.OPEN), input: positionInput }),
  z.object({
    action: z.literal(POSITION_ACTION.EDIT),
    id: z.uuid(),
    revision: z.number().int().positive(),
    input: positionInput,
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
    }),
  }),
]);
