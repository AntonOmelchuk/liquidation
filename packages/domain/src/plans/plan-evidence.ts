import { z } from "zod";
import { screenshotIdsSchema } from "../evidence/screenshots.ts";
import { PLAN_EVENT } from "./constants.ts";

const noteFields = {
  text: z.string().trim().max(4000),
  screenshotIds: screenshotIdsSchema,
};
const hasEvidence = (value: {
  text: string;
  screenshotIds: readonly string[];
}) => value.text.length > 0 || value.screenshotIds.length > 0;

export const planNoteSchema = z.object(noteFields).refine(hasEvidence);

export const planAnalysisBlockSchema = z
  .object({
    ...noteFields,
    id: z.uuid(),
    timeframe: z.string().trim().min(1).max(24),
  })
  .refine(hasEvidence);

const eventIdentity = {
  id: z.uuid(),
  at: z.iso.datetime(),
};

export const planEventSchema = z.discriminatedUnion("kind", [
  z.object({
    ...eventIdentity,
    kind: z.literal(PLAN_EVENT.UPDATE),
    note: planNoteSchema,
  }),
  z.object({
    ...eventIdentity,
    kind: z.literal(PLAN_EVENT.VOID),
    reason: z.string().trim().min(1).max(4000),
  }),
  z.object({ ...eventIdentity, kind: z.literal(PLAN_EVENT.RESTORE) }),
]);
