import type { Journal } from "@liquidation/domain/journal/types";
import { TRASH_KIND } from "@liquidation/domain/journal/trash/constants";
import { deletedPlan } from "@liquidation/domain/journal/trash/trash";
import { WORKSPACE_RECORD } from "@liquidation/domain/workspace/constants";
import { lectureScreenshotIds } from "@liquidation/domain/workspace/learning";
import type { WorkspaceCommand } from "@liquidation/domain/workspace/types";
import { InvalidJournalInput, JournalConflict } from "../errors.ts";
import { assertScreenshotAttachments } from "./screenshot-attachments.ts";
import { assertNewIdentity, latestTrashedRevision } from "./trash-records.ts";

function upsert<T extends { revision: number }>(
  records: T[],
  find: (record: T) => boolean,
  expected: number | undefined,
  create: (revision: number, previous?: T) => T,
  revisionFloor = 0,
) {
  const index = records.findIndex(find);
  const previous = records[index];
  const actual = previous?.revision;
  if (expected !== actual)
    throw new JournalConflict(
      "This journal entry changed. Reload before saving.",
    );
  const next = create(Math.max(actual ?? 0, revisionFloor) + 1, previous);
  if (index < 0) records.push(next);
  else records[index] = next;
}

export function mutateWorkspace(
  journal: Journal,
  command: WorkspaceCommand,
  uploads: ReadonlyMap<string, Uint8Array>,
) {
  const { workspace, trades, positions } = journal;
  if (uploads.size && command.record === WORKSPACE_RECORD.PREPARATION) {
    throw new InvalidJournalInput("This record does not accept images.");
  }
  switch (command.record) {
    case WORKSPACE_RECORD.THOUGHT: {
      const { day, input, revision } = command;
      upsert(
        workspace.thoughts,
        (item) => item.day === day,
        revision,
        (next, previous) => {
          assertScreenshotAttachments(
            new Set(previous?.screenshotIds),
            new Set(input.screenshotIds),
            uploads,
          );
          return { ...input, day, revision: next };
        },
        latestTrashedRevision(journal, TRASH_KIND.THOUGHT, day),
      );
      break;
    }
    case WORKSPACE_RECORD.WATCHLIST: {
      const { start, input, revision } = command;
      upsert(
        workspace.watchlists,
        (item) => item.start === start,
        revision,
        (next, previous) => {
          for (const item of input.items) {
            const old = previous?.items.find(
              ({ symbol }) => symbol === item.symbol,
            );
            for (const id of item.planIds) {
              const plan = journal.plans.find((plan) => plan.id === id);
              if (
                (!plan || plan.setup.symbol !== item.symbol) &&
                !old?.planIds.includes(id)
              ) {
                throw new InvalidJournalInput(
                  "An associated plan is unavailable for this asset.",
                );
              }
            }
          }
          assertScreenshotAttachments(
            new Set(
              previous?.items.flatMap(({ screenshotIds }) => screenshotIds),
            ),
            new Set(input.items.flatMap(({ screenshotIds }) => screenshotIds)),
            uploads,
          );
          return { ...input, start, revision: next };
        },
        latestTrashedRevision(journal, TRASH_KIND.WATCHLIST, start),
      );
      break;
    }
    case WORKSPACE_RECORD.MISSED: {
      const { id, input, revision } = command;
      if (revision === undefined)
        assertNewIdentity(journal, TRASH_KIND.MISSED, id);
      upsert(
        workspace.missedTrades,
        (item) => item.id === id,
        revision,
        (next, previous) => {
          if (input.planId) {
            const plan =
              journal.plans.find(({ id }) => id === input.planId) ??
              (previous?.planId === input.planId
                ? deletedPlan(journal.trash, input.planId)
                : undefined);
            if (
              !plan ||
              (previous?.planId !== input.planId &&
                (plan.setup.symbol !== input.symbol ||
                  plan.setup.direction !== input.direction))
            ) {
              throw new InvalidJournalInput(
                "Choose a plan for the same symbol and direction.",
              );
            }
            if (
              workspace.missedTrades.some(
                (item) => item.id !== id && item.planId === input.planId,
              )
            )
              throw new JournalConflict(
                "A missed trade is already linked to this plan.",
              );
          }
          assertScreenshotAttachments(
            new Set(previous?.screenshotIds),
            new Set(input.screenshotIds),
            uploads,
          );
          return { ...input, id, revision: next };
        },
      );
      break;
    }
    case WORKSPACE_RECORD.PREPARATION: {
      const { kind, start, input, revision } = command;
      upsert(
        workspace.preparations,
        (item) => item.kind === kind && item.start === start,
        revision,
        (next) => ({ ...input, kind, start, revision: next }),
        latestTrashedRevision(
          journal,
          TRASH_KIND.PREPARATION,
          kind + ":" + start,
        ),
      );
      break;
    }
    case WORKSPACE_RECORD.REPORT: {
      const { kind, start, input, revision } = command;
      const ids = new Set([...trades, ...positions].map(({ id }) => id));
      const previous = workspace.reports.find(
        (item) => item.kind === kind && item.start === start,
      );
      for (const item of previous?.assessments ?? []) ids.add(item.id);
      if (previous?.bestTradeId) ids.add(previous.bestTradeId);
      if (
        input.assessments.some(({ id }) => !ids.has(id)) ||
        (input.bestTradeId && !ids.has(input.bestTradeId))
      ) {
        throw new InvalidJournalInput("A reviewed trade is unavailable.");
      }
      upsert(
        workspace.reports,
        (item) => item.kind === kind && item.start === start,
        revision,
        (next, old) => {
          assertScreenshotAttachments(
            new Set(old?.screenshotIds),
            new Set(input.screenshotIds),
            uploads,
          );
          return { ...input, kind, start, revision: next };
        },
        latestTrashedRevision(journal, TRASH_KIND.REPORT, kind + ":" + start),
      );
      break;
    }
    case WORKSPACE_RECORD.LEARNING: {
      const { id, input, revision } = command;
      if (revision === undefined)
        assertNewIdentity(journal, TRASH_KIND.LEARNING, id);
      upsert(
        workspace.learning,
        (item) => item.id === id,
        revision,
        (next, previous) => {
          assertScreenshotAttachments(
            new Set(lectureScreenshotIds(previous?.blocks)),
            new Set(lectureScreenshotIds(input.blocks)),
            uploads,
          );
          return {
            ...input,
            id,
            revision: next,
            updatedAt: new Date().toISOString(),
          };
        },
      );
      break;
    }
    case WORKSPACE_RECORD.HIGHLIGHT: {
      const { id, input, revision } = command;
      if (revision === undefined)
        assertNewIdentity(journal, TRASH_KIND.HIGHLIGHT, id);
      upsert(
        workspace.highlights,
        (item) => item.id === id,
        revision,
        (next, previous) => {
          if (
            !previous &&
            trades.some((trade) => trade.id === id) === Boolean(input.example)
          )
            throw new InvalidJournalInput("The featured trade is unavailable.");
          if (previous && Boolean(previous.example) !== Boolean(input.example))
            throw new InvalidJournalInput(
              "The source of a saved example is fixed.",
            );
          assertScreenshotAttachments(
            new Set(previous?.screenshotIds),
            new Set(input.screenshotIds),
            uploads,
          );
          return { ...input, id, revision: next };
        },
      );
      break;
    }
  }
  return journal;
}
