import { z } from "zod";

export const moneySchema = z
  .number()
  .min(-1_000_000_000)
  .max(1_000_000_000)
  .multipleOf(0.01);

export function toCents(amount: number) {
  return Math.round(amount * 100);
}

export function fromCents(cents: number) {
  return cents / 100;
}
