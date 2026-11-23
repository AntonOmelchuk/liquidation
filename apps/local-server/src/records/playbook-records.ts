import type { Journal } from "@liquidation/domain/journal/types";
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
} from "@liquidation/domain/playbooks/types";

import {
  currentVersion,
  entryRules,
  linkedVersion,
} from "@liquidation/domain/playbooks/playbook";
import { InvalidJournalInput, JournalConflict } from "../errors.ts";
import { assertScreenshotAttachments } from "./screenshot-attachments.ts";

function rulesOf({
  setups,
  filters,
  management,
}: ReturnType<typeof currentVersion>) {
  return { setups, filters, management };
}

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
    const latest = currentVersion(previous);
    const changed =
      JSON.stringify(rulesOf(latest)) !== JSON.stringify(command.rules);
    return {
      ...updated,
      ...command.metadata,
      versions: changed
        ? [
            ...previous.versions,
            { ...command.rules, number: latest.number + 1, at },
          ]
        : previous.versions,
    };
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
          JSON.stringify(rulesOf(currentVersion(previous))) ===
            JSON.stringify(command.rules)
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
      versions: [{ ...command.rules, number: 1, at }],
      reviews: [],
    };
  }

  if (!previous || previous.revision !== command.revision) {
    throw new JournalConflict("Playbook has changed.");
  }
  return editPlaybook(previous, command, at);
}

function reviewScreenshots(playbook?: Playbook) {
  return new Set(
    playbook?.reviews.flatMap(({ screenshotIds }) => screenshotIds),
  );
}

export function mutatePlaybook(
  journal: Journal,
  command: PlaybookCommand,
  uploads: ReadonlyMap<string, Uint8Array>,
) {
  const index = journal.playbooks.findIndex(({ id }) => id === command.id);
  const previous = journal.playbooks[index];
  const book = nextPlaybook(previous, command, new Date().toISOString());
  assertScreenshotAttachments(
    reviewScreenshots(previous),
    reviewScreenshots(book),
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

export function assertPlaybookLink(
  journal: Journal,
  link: PlaybookLink | undefined,
  previous?: PlaybookLink,
  closed = false,
) {
  if (!link) return;
  const book = journal.playbooks.find(({ id }) => id === link.id);
  if (
    !book ||
    (book.status === PLAYBOOK_STATUS.RETIRED && book.id !== previous?.id)
  ) {
    throw new InvalidJournalInput("The linked playbook is unavailable.");
  }
  if (link.management && !closed) {
    throw new InvalidJournalInput(
      "Management is reviewed when the position closes.",
    );
  }
  if (link.version === undefined) return;
  const version = linkedVersion(book, link);
  if (
    !version ||
    (link.setupId && !version.setups.some(({ id }) => id === link.setupId)) ||
    (link.entry && !link.setupId) ||
    !matchesRules(link.entry, entryRules(version, link.setupId)) ||
    !matchesRules(link.management, version.management)
  ) {
    throw new InvalidJournalInput(
      "The checklist does not match the linked playbook version.",
    );
  }
}
