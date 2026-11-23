import type { Journal } from "@liquidation/domain/journal/types";
import {
  PLAN_ACTION,
  PLAN_EVENT,
  PLAN_STATUS,
} from "@liquidation/domain/plans/constants";
import {
  getPlanVoiding,
  planScreenshotIds,
} from "@liquidation/domain/plans/plan-lifecycle";
import type {
  Plan,
  PlanCommand,
  PlanTradeChange,
} from "@liquidation/domain/plans/types";
import { randomUUID } from "node:crypto";
import type { PlanEdit } from "./types.ts";

import { InvalidJournalInput, JournalConflict } from "../errors.ts";
import { assertPlaybookLink } from "./playbook-records.ts";
import { assertScreenshotAttachments } from "./screenshot-attachments.ts";

function editPlan(plan: Plan, command: PlanEdit, now: string): Plan {
  const updated = { ...plan, updatedAt: now, revision: plan.revision + 1 };
  const events = plan.events ?? [];

  switch (command.action) {
    case PLAN_ACTION.EDIT: {
      const setupChanged =
        JSON.stringify(plan.setup) !== JSON.stringify(command.setup);
      return {
        ...updated,
        setup: command.setup,
        originalSetup:
          plan.originalSetup ?? (setupChanged ? plan.setup : undefined),
        review: command.review,
        recap:
          command.recap === undefined
            ? plan.recap
            : (command.recap ?? undefined),
      };
    }
    case PLAN_ACTION.ADD_UPDATE:
      if (events.some(({ id }) => id === command.eventId)) {
        throw new JournalConflict("The update ID is already in use.");
      }
      return {
        ...updated,
        events: [
          ...events,
          {
            id: command.eventId,
            kind: PLAN_EVENT.UPDATE,
            at: now,
            note: command.note,
          },
        ],
      };
    case PLAN_ACTION.EDIT_UPDATE: {
      const previous = events.find(({ id }) => id === command.eventId);
      if (previous?.kind !== PLAN_EVENT.UPDATE)
        throw new InvalidJournalInput("Unknown plan update.");
      return {
        ...updated,
        events: events.map((event) =>
          event.id === previous.id
            ? { ...previous, note: command.note }
            : event,
        ),
      };
    }
    case PLAN_ACTION.VOID:
      if (getPlanVoiding(plan))
        throw new JournalConflict("Plan is already voided.");
      return {
        ...updated,
        events: [
          ...events,
          {
            id: randomUUID(),
            kind: PLAN_EVENT.VOID,
            at: now,
            reason: command.reason,
          },
        ],
      };
    case PLAN_ACTION.RESTORE:
      if (!getPlanVoiding(plan))
        throw new JournalConflict("Plan is already active.");
      return {
        ...updated,
        events: [
          ...events,
          { id: randomUUID(), kind: PLAN_EVENT.RESTORE, at: now },
        ],
      };
  }
}

function nextPlan(
  previous: Plan | undefined,
  command: PlanCommand,
  now: string,
) {
  if (command.action === PLAN_ACTION.CREATE) {
    if (previous) {
      const original = previous.originalSetup ?? previous.setup;
      if (JSON.stringify(original) === JSON.stringify(command.setup))
        return previous;
      throw new JournalConflict("A plan with this ID already exists.");
    }

    return {
      id: command.id,
      revision: 1,
      createdAt: now,
      updatedAt: now,
      setup: command.setup,
      review: command.review ?? { status: PLAN_STATUS.WAITING },
    } satisfies Plan;
  }

  if (!previous || previous.revision !== command.revision) {
    throw new JournalConflict("Plan has changed.");
  }
  return editPlan(previous, command, now);
}

function applyTradeChanges(
  journal: Journal,
  planId: string,
  changes: readonly PlanTradeChange[],
) {
  const records = new Map(
    [...journal.positions, ...journal.trades].map((record) => [
      record.id,
      record,
    ]),
  );
  for (const { id, previousPlanId, attached } of changes) {
    if (!attached && previousPlanId !== planId) {
      throw new InvalidJournalInput(
        "This record is not linked to the edited plan.",
      );
    }
    const record = records.get(id);
    if (!record)
      throw new JournalConflict("A selected trade no longer exists.");
    const currentPlanId = record.planId ?? null;
    const nextPlanId = attached ? planId : null;
    if (currentPlanId === nextPlanId) continue;
    if (currentPlanId !== previousPlanId) {
      throw new JournalConflict(
        "A selected trade was linked to a different plan.",
      );
    }

    record.planId = nextPlanId ?? undefined;
    if ("revision" in record) record.revision += 1;
  }
}

export function mutatePlan(
  journal: Journal,
  command: PlanCommand,
  uploads: ReadonlyMap<string, Uint8Array>,
) {
  const index = journal.plans.findIndex(({ id }) => id === command.id);
  const previous = journal.plans[index];
  const plan = nextPlan(previous, command, new Date().toISOString());
  const before = previous ? planScreenshotIds(previous) : new Set<string>();
  const after = planScreenshotIds(plan);

  assertScreenshotAttachments(before, after, uploads);

  if (
    (command.action === PLAN_ACTION.CREATE && !previous) ||
    command.action === PLAN_ACTION.EDIT
  ) {
    assertPlaybookLink(journal, plan.setup.playbook, previous?.setup.playbook);
    if (command.tradeChanges?.length) {
      applyTradeChanges(journal, plan.id, command.tradeChanges);
    }
  }

  if (index < 0) journal.plans.unshift(plan);
  else journal.plans[index] = plan;
}
