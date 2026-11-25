import type { z } from "zod";
import type { TRASH_KIND } from "./constants.ts";
import type { trashCommandSchema, trashEntrySchema } from "./trash.ts";

export type TrashKind = (typeof TRASH_KIND)[keyof typeof TRASH_KIND];
export type TrashEntry = z.infer<typeof trashEntrySchema>;
export type TrashCommand = z.infer<typeof trashCommandSchema>;
export type TrashValueByKind = {
  [Entry in TrashEntry as Entry["kind"]]: Entry["value"];
};
