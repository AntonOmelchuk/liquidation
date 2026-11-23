import type { z } from "zod";
import type { journalSchema } from "./journal.ts";

export type Journal = z.infer<typeof journalSchema>;
