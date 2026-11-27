import type { z } from "zod";
import type { backupManifestSchema, backupPreviewSchema } from "./contracts.ts";

export type BackupManifest = z.infer<typeof backupManifestSchema>;
export type BackupPreview = z.infer<typeof backupPreviewSchema>;
export type BackupSummary = BackupPreview["summary"];
