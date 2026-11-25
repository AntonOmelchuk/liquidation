import { z } from "zod";

export const instrumentSymbolSchema = z
  .string()
  .trim()
  .min(1)
  .max(24)
  .transform((value) => value.toUpperCase());
