import { BACKTEST_ACTION } from "@liquidation/domain/backtests/constants";
import type {
  Backtest,
  BacktestCommand,
} from "@liquidation/domain/backtests/types";
import type { Journal } from "@liquidation/domain/journal/types";
import { TRASH_KIND } from "@liquidation/domain/journal/trash/constants";

import { InvalidJournalInput, JournalConflict } from "../errors.ts";
import { assertPlaybookLink } from "./playbook-records.ts";
import { assertScreenshotAttachments } from "./screenshot-attachments.ts";
import { assertNewIdentity } from "./trash-records.ts";

function nextBacktest(
  journal: Journal,
  previous: Backtest | undefined,
  command: BacktestCommand,
): Backtest {
  const at = new Date().toISOString();
  if (command.action === BACKTEST_ACTION.CREATE) {
    if (previous) {
      const { title, thesis, playbook } = previous;
      if (
        previous.revision === 1 &&
        JSON.stringify({ title, thesis, playbook }) ===
          JSON.stringify(command.metadata)
      )
        return previous;
      throw new JournalConflict("A backtest with this ID already exists.");
    }
    assertPlaybookLink(journal, command.metadata.playbook);
    return {
      ...command.metadata,
      id: command.id,
      revision: 1,
      createdAt: at,
      updatedAt: at,
      samples: [],
    };
  }
  if (!previous || previous.revision !== command.revision) {
    throw new JournalConflict("Backtest has changed.");
  }

  const updated = {
    ...previous,
    updatedAt: at,
    revision: previous.revision + 1,
  };
  if (command.action === BACKTEST_ACTION.EDIT) {
    assertPlaybookLink(journal, command.metadata.playbook, previous.playbook);
    return {
      ...updated,
      ...command.metadata,
      playbook: command.metadata.playbook,
    };
  }

  const exists = previous.samples.some(({ id }) => id === command.sample.id);
  if (command.action === BACKTEST_ACTION.ADD_SAMPLE) {
    if (exists)
      throw new JournalConflict("A sample with this ID already exists.");
    return { ...updated, samples: [...previous.samples, command.sample] };
  }
  if (!exists) throw new InvalidJournalInput("Unknown backtest sample.");
  return {
    ...updated,
    samples: previous.samples.map((sample) =>
      sample.id === command.sample.id ? command.sample : sample,
    ),
  };
}

function screenshotIds(run?: Backtest) {
  return new Set(run?.samples.flatMap(({ screenshotIds }) => screenshotIds));
}

export function mutateBacktest(
  journal: Journal,
  command: BacktestCommand,
  uploads: ReadonlyMap<string, Uint8Array>,
) {
  if (command.action === BACKTEST_ACTION.CREATE)
    assertNewIdentity(journal, TRASH_KIND.BACKTEST, command.id);
  const index = journal.backtests.findIndex(({ id }) => id === command.id);
  const previous = journal.backtests[index];
  const run = nextBacktest(journal, previous, command);
  assertScreenshotAttachments(
    screenshotIds(previous),
    screenshotIds(run),
    uploads,
  );
  if (index < 0) journal.backtests.unshift(run);
  else journal.backtests[index] = run;
}
