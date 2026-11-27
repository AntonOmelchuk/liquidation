import { z } from "zod";
import { currencySchema } from "../accounts/account.ts";
import { screenshotIdSchema } from "../evidence/screenshots.ts";
import { journalSchema } from "../journal/journal.ts";
import { BACKUP_FORMAT, BACKUP_VERSION } from "./constants.ts";

export const backupManifestSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  version: z.literal(BACKUP_VERSION),
  createdAt: z.iso.datetime(),
  missingScreenshots: z
    .array(screenshotIdSchema)
    .refine((ids) => new Set(ids).size === ids.length),
});

const count = z.number().int().nonnegative();
const backupSummarySchema = z.object({
  createdAt: z.iso.datetime(),
  currency: currencySchema,
  accounts: count,
  trades: count,
  positions: count,
  plans: count,
  playbooks: count,
  backtests: count,
  learning: count,
  newsReactions: count.default(0),
  screenshots: count,
  missingScreenshots: count,
  trash: count,
});

export const backupSelectionSchema = z.object({ token: z.uuid() });
export const backupPreviewSchema = backupSelectionSchema.extend({
  summary: backupSummarySchema,
});
export const backupRestoreSchema = z.object({
  journal: journalSchema,
  safetyId: z.uuid(),
});
