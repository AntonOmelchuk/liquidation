import { z } from "zod";
import { fromCents, moneySchema, toCents } from "../shared/money.ts";
import {
  MAX_TRADE_RISK_PERCENT,
  PNL_CALCULATION,
  TRADE_RISK_PERCENT_STEP,
} from "./constants.ts";
import { priceMoveR, validPriceGeometry } from "./prices.ts";
import type {
  PnlCalculation,
  RiskSizing,
  TradeDirection,
  TradePrices,
} from "./types.ts";

export const riskPercentSchema = z
  .number()
  .positive()
  .max(MAX_TRADE_RISK_PERCENT)
  .multipleOf(TRADE_RISK_PERCENT_STEP);
export const riskSizingSchema = z.object({
  accountId: z.uuid(),
  balanceCents: z.int().positive(),
  percent: riskPercentSchema,
});

export const pnlCalculationSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal(PNL_CALCULATION.PRICES) }),
  z.object({
    mode: z.literal(PNL_CALCULATION.R_MULTIPLE),
    multiple: z.number(),
  }),
]);

export function riskFromSizing(sizing: RiskSizing) {
  const amount = fromCents(
    Math.round(sizing.balanceCents * (sizing.percent / 100)),
  );
  const result = moneySchema.positive().safeParse(amount);
  return result.success ? result.data : null;
}

export function validRiskSizing({
  risk,
  riskSizing,
}: {
  risk: number | null;
  riskSizing?: RiskSizing;
}) {
  return !riskSizing || (risk !== null && riskFromSizing(riskSizing) === risk);
}

export function calculatedGrossProfit(
  risk: number | null,
  calculation: PnlCalculation,
  direction: TradeDirection,
  prices?: TradePrices,
) {
  if (risk === null || risk <= 0) return null;
  const multiple =
    calculation.mode === PNL_CALCULATION.R_MULTIPLE
      ? calculation.multiple
      : validPriceGeometry(direction, prices)
        ? priceMoveR(direction, prices, prices?.exit)
        : null;
  if (multiple === null || !Number.isFinite(multiple)) return null;
  const cents = toCents(risk) * multiple;
  const profit = fromCents(Math.sign(cents) * Math.round(Math.abs(cents)));
  const result = moneySchema.safeParse(profit);
  return result.success ? result.data : null;
}
