import type { z } from "zod";
import type { journalSchema, storedJournalSchema } from "./journal.ts";

export type Journal = z.infer<typeof journalSchema>;
export type StoredJournal = z.infer<typeof storedJournalSchema>;
