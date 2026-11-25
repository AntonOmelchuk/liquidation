import { z } from "zod";
import { accountSchema, movementSchema } from "../../accounts/account.ts";
import { backtestSchema } from "../../backtests/backtest.ts";
import { planSchema } from "../../plans/plan.ts";
import { playbookSchema } from "../../playbooks/playbook.ts";
import { positionSchema } from "../../trades/position.ts";
import { tradeSchema } from "../../trades/trade.ts";
import {
  missedTradeSchema,
  thoughtSchema,
  watchlistSchema,
} from "../../workspace/planning.ts";
import { workspaceSchema } from "../../workspace/workspace.ts";
import { TRASH_ACTION, TRASH_KIND, TRASH_KINDS } from "./constants.ts";
import type { TrashEntry, TrashKind, TrashValueByKind } from "./types.ts";

const identity = { id: z.uuid(), at: z.iso.datetime() };

export const trashEntrySchema = z.discriminatedUnion("kind", [
  z.object({
    ...identity,
    kind: z.literal(TRASH_KIND.ACCOUNT),
    value: accountSchema,
  }),
  z.object({
    ...identity,
    kind: z.literal(TRASH_KIND.MOVEMENT),
    value: movementSchema,
  }),
  z.object({
    ...identity,
    kind: z.literal(TRASH_KIND.TRADE),
    value: tradeSchema,
  }),
  z.object({
    ...identity,
    kind: z.literal(TRASH_KIND.POSITION),
    value: positionSchema,
  }),
  z.object({
    ...identity,
    kind: z.literal(TRASH_KIND.PLAN),
    value: planSchema,
  }),
  z.object({
    ...identity,
    kind: z.literal(TRASH_KIND.PLAYBOOK),
    value: playbookSchema,
  }),
  z.object({
    ...identity,
    kind: z.literal(TRASH_KIND.BACKTEST),
    value: backtestSchema,
  }),
  z.object({
    ...identity,
    kind: z.literal(TRASH_KIND.LEARNING),
    value: workspaceSchema.shape.learning.unwrap().element,
  }),
  z.object({
    ...identity,
    kind: z.literal(TRASH_KIND.HIGHLIGHT),
    value: workspaceSchema.shape.highlights.unwrap().element,
  }),
  z.object({
    ...identity,
    kind: z.literal(TRASH_KIND.REPORT),
    value: workspaceSchema.shape.reports.unwrap().element,
  }),
  z.object({
    ...identity,
    kind: z.literal(TRASH_KIND.PREPARATION),
    value: workspaceSchema.shape.preparations.unwrap().element,
  }),
  z.object({
    ...identity,
    kind: z.literal(TRASH_KIND.THOUGHT),
    value: thoughtSchema,
  }),
  z.object({
    ...identity,
    kind: z.literal(TRASH_KIND.WATCHLIST),
    value: watchlistSchema,
  }),
  z.object({
    ...identity,
    kind: z.literal(TRASH_KIND.MISSED),
    value: missedTradeSchema,
  }),
]);

export const trashCommandSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal(TRASH_ACTION.MOVE),
    kind: z.enum(TRASH_KINDS),
    key: z.string().min(1).max(80),
    revision: z.number().int().positive().optional(),
  }),
  z.object({ action: z.literal(TRASH_ACTION.RESTORE), id: z.uuid() }),
  z.object({ action: z.literal(TRASH_ACTION.PURGE), id: z.uuid() }),
]);

export function trashedRecords<K extends TrashKind>(
  trash: readonly TrashEntry[],
  kind: K,
): TrashValueByKind[K][] {
  return trash
    .filter((entry) => entry.kind === kind)
    .map((entry) => entry.value as TrashValueByKind[K]);
}

export function trashRecordKey(value: TrashEntry["value"]) {
  if ("id" in value) return value.id;
  if ("day" in value) return value.day;
  if ("kind" in value) return value.kind + ":" + value.start;
  return value.start;
}

export function deletedPlan(trash: readonly TrashEntry[], id?: string) {
  const entry = trash.find(
    (entry) => entry.kind === TRASH_KIND.PLAN && entry.value.id === id,
  );
  return entry?.kind === TRASH_KIND.PLAN ? entry.value : undefined;
}

export function deletedPlaybook(trash: readonly TrashEntry[], id?: string) {
  const entry = trash.find(
    (entry) => entry.kind === TRASH_KIND.PLAYBOOK && entry.value.id === id,
  );
  return entry?.kind === TRASH_KIND.PLAYBOOK ? entry.value : undefined;
}
