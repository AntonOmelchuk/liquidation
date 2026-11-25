import type { z } from "zod";
import type { positionCommand, positionSchema } from "./position.ts";
import type { tradeLinkCommand, tradeLinksSchema } from "./trade-links.ts";
import type { tradeInput, tradeSchema } from "./trade.ts";
import type { tradePricesSchema } from "./prices.ts";

export type TradeInput = z.infer<typeof tradeInput>;

export type Trade = z.infer<typeof tradeSchema>;

export type TradeLinks = z.infer<typeof tradeLinksSchema>;
export type TradePrices = z.infer<typeof tradePricesSchema>;

export type TradeLinkCommand = z.infer<typeof tradeLinkCommand>;

export type Position = z.infer<typeof positionSchema>;

export type PositionCommand = z.infer<typeof positionCommand>;

export type MistakeReview = {
  mistakes?: readonly string[];
  criticalMistakes?: readonly string[];
  mistakesReviewed?: boolean;
};
