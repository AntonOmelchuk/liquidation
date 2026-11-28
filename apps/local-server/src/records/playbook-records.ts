import type { Journal } from "@liquidation/domain/journal/types";
import { deletedPlaybook } from "@liquidation/domain/journal/trash/trash";
import { TRASH_KIND } from "@liquidation/domain/journal/trash/constants";
import { getPlaybookTemplate } from "@liquidation/domain/playbooks/strategy";
import {
  PLAYBOOK_ACTION,
  PLAYBOOK_STATUS,
} from "@liquidation/domain/playbooks/constants";
import type {
  Checklist,
  Playbook,
  PlaybookCommand,
  PlaybookLink,
  PlaybookRule,
  PlaybookReference,
} from "@liquidation/domain/playbooks/types";

import {
  rulesForSetup,
  tradePlaybookRules,
  playbookScreenshotIds,
} from "@liquidation/domain/playbooks/playbook";
import { InvalidJournalInput, JournalConflict } from "../errors.ts";
import { assertScreenshotAttachments } from "./screenshot-attachments.ts";
import { assertNewIdentity } from "./trash-records.ts";

function editPlaybook(
  previous: Playbook,
  command: Exclude<PlaybookCommand, { action: typeof PLAYBOOK_ACTION.CREATE }>,
  at: string,
): Playbook {
  const updated = {
    ...previous,
    updatedAt: at,
    revision: previous.revision + 1,
  };
  if (command.action === PLAYBOOK_ACTION.EDIT) {
    if (
      getPlaybookTemplate(previous.rules.strategy) !==
      getPlaybookTemplate(command.rules.strategy)
    ) {
      throw new InvalidJournalInput("The playbook template cannot be changed.");
    }
    return { ...updated, ...command.metadata, rules: command.rules };
  }

  const existing = previous.reviews.find(({ id }) => id === command.reviewId);
  if (command.action === PLAYBOOK_ACTION.ADD_REVIEW) {
    if (existing) throw new JournalConflict("The review ID is already in use.");
    return {
      ...updated,
      reviews: [
        ...previous.reviews,
        { id: command.reviewId, at, ...command.note },
      ],
    };
  }

  if (!existing) throw new InvalidJournalInput("Unknown playbook review.");
  return {
    ...updated,
    reviews: previous.reviews.map((review) =>
      review.id === existing.id ? { ...review, ...command.note } : review,
    ),
  };
}

function nextPlaybook(
  previous: Playbook | undefined,
  command: PlaybookCommand,
  at: string,
): Playbook {
  if (command.action === PLAYBOOK_ACTION.CREATE) {
    if (previous) {
      if (previous.revision === 1) {
        const { title, status, overview, notes, reviewEvery, limits } =
          previous;
        const metadata = {
          title,
          status,
          overview,
          notes,
          reviewEvery,
          limits,
        };
        if (
          JSON.stringify(metadata) === JSON.stringify(command.metadata) &&
          JSON.stringify(previous.rules) === JSON.stringify(command.rules)
        )
          return previous;
      }
      throw new JournalConflict("A playbook with this ID already exists.");
    }
    return {
      id: command.id,
      revision: 1,
      createdAt: at,
      updatedAt: at,
      ...command.metadata,
      rules: command.rules,
      reviews: [],
    };
  }

  if (!previous || previous.revision !== command.revision) {
    throw new JournalConflict("Playbook has changed.");
  }
  return editPlaybook(previous, command, at);
}

export function mutatePlaybook(
  journal: Journal,
  command: PlaybookCommand,
  uploads: ReadonlyMap<string, Uint8Array>,
) {
  if (command.action === PLAYBOOK_ACTION.CREATE)
    assertNewIdentity(journal, TRASH_KIND.PLAYBOOK, command.id);
  const index = journal.playbooks.findIndex(({ id }) => id === command.id);
  const previous = journal.playbooks[index];
  const book = nextPlaybook(previous, command, new Date().toISOString());
  assertScreenshotAttachments(
    playbookScreenshotIds(previous),
    playbookScreenshotIds(book),
    uploads,
  );
  if (index < 0) journal.playbooks.unshift(book);
  else journal.playbooks[index] = book;
}

function matchesRules(
  answers: Checklist | undefined,
  rules: readonly PlaybookRule[],
) {
  if (!answers) return true;
  const ids = new Set(answers.map(({ ruleId }) => ruleId));
  return (
    answers.length === rules.length && rules.every(({ id }) => ids.has(id))
  );
}

function reasonsRecorded(answers: Checklist | undefined, previous?: Checklist) {
  return (
    !answers ||
    answers.every(
      (answer) =>
        answer.met ||
        Boolean(answer.reason) ||
        previous?.some(
          (old) => old.ruleId === answer.ruleId && !old.met && !old.reason,
        ),
    )
  );
}

function linkedPlaybook(
  journal: Journal,
  link: PlaybookReference,
  previous?: PlaybookReference,
) {
  const book =
    journal.playbooks.find(({ id }) => id === link.id) ??
    (previous?.id === link.id
      ? deletedPlaybook(journal.trash, link.id)
      : undefined);
  if (
    !book ||
    (book.status === PLAYBOOK_STATUS.RETIRED && book.id !== previous?.id)
  )
    throw new InvalidJournalInput("The linked playbook is unavailable.");
  return book;
}

export function assertPlaybookLink(
  journal: Journal,
  link: PlaybookReference | undefined,
  previous?: PlaybookReference,
) {
  if (link) linkedPlaybook(journal, link, previous);
}

export function recordTradePlaybook(
  journal: Journal,
  link: PlaybookLink | undefined,
  previous?: PlaybookLink,
  closed = false,
): PlaybookLink | undefined {
  if (!link) return undefined;
  const sameSetup =
    previous?.id === link.id && previous.setupId === link.setupId;
  const book = linkedPlaybook(journal, link, previous);
  const historical =
    sameSetup &&
    previous &&
    (previous.recordedRules || previous.version !== undefined)
      ? tradePlaybookRules(book, previous)
      : undefined;
  const rules = historical ?? rulesForSetup(book.rules, link.setupId);
  if (link.management && !closed) {
    throw new InvalidJournalInput(
      "Management is reviewed when the position closes.",
    );
  }
  if (
    !reasonsRecorded(link.entry, sameSetup ? previous?.entry : undefined) ||
    !reasonsRecorded(
      link.management,
      sameSetup ? previous?.management : undefined,
    )
  ) {
    throw new InvalidJournalInput(
      "Explain each rule exception in the checklist.",
    );
  }
  if (
    (link.setupId && rules.setupName === undefined) ||
    (link.entry && !link.setupId) ||
    !matchesRules(link.entry, rules.entry) ||
    !matchesRules(link.management, rules.management)
  ) {
    throw new InvalidJournalInput(
      "The checklist does not match the linked playbook.",
    );
  }
  return {
    id: link.id,
    setupId: link.setupId,
    entry: link.entry,
    management: link.management,
    recordedRules: rules,
  };
}
