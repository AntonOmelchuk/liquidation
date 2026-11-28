import { z } from "zod";

export const dailyQuoteSchema = z.object({
  text: z.string().trim().min(1).max(320),
  author: z.string().trim().min(1).max(100),
});
