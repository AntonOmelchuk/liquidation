import type { BacktestCommand } from "@liquidation/domain/backtests/types";
import type { AccountCommand } from "@liquidation/domain/accounts/types";
import { TRASH_ACTION } from "@liquidation/domain/journal/trash/constants";
import type { PlanCommand } from "@liquidation/domain/plans/types";
import type { PlaybookCommand } from "@liquidation/domain/playbooks/types";
import type {
  PositionCommand,
  TradeLinkCommand,
} from "@liquidation/domain/trades/types";
import { homedir } from "node:os";
import { join } from "node:path";

import type { TradeInput } from "@liquidation/domain/trades/types";
import type { WorkspaceCommand } from "@liquidation/domain/workspace/types";
import type { TrashCommand } from "@liquidation/domain/journal/trash/types";
import { mutateTrash } from "./records/trash-records.ts";
import { mutateBacktest } from "./records/backtest-records.ts";
import { mutatePlan } from "./records/plan-records.ts";
import { mutatePlaybook } from "./records/playbook-records.ts";
import {
  appendTrade,
  mutatePosition,
  mutateTradeLinks,
} from "./records/trade-records.ts";
import { createJournalStorage } from "./storage/journal-store.ts";
import { mutateWorkspace } from "./records/workspace-records.ts";
import { mutateAccount } from "./records/account-records.ts";

export function createJournal(
  directory = process.env.LIQUIDATION_DATA_DIR ||
    join(homedir(), ".liquidation"),
) {
  const { read, write, readScreenshot } = createJournalStorage(directory);
  function updatePlan(
    command: PlanCommand,
    uploads = new Map<string, Uint8Array>(),
  ) {
    return write((journal) => {
      mutatePlan(journal, command, uploads);
      return journal;
    }, uploads);
  }

  function updatePlaybook(
    command: PlaybookCommand,
    uploads = new Map<string, Uint8Array>(),
  ) {
    return write((journal) => {
      mutatePlaybook(journal, command, uploads);
      return journal;
    }, uploads);
  }

  function updateBacktest(
    command: BacktestCommand,
    uploads = new Map<string, Uint8Array>(),
  ) {
    return write((journal) => {
      mutateBacktest(journal, command, uploads);
      return journal;
    }, uploads);
  }

  return {
    read,
    append: (input: TradeInput, uploads = new Map<string, Uint8Array>()) =>
      write((journal) => appendTrade(journal, input, uploads), uploads),
    updatePosition: (
      command: PositionCommand,
      uploads = new Map<string, Uint8Array>(),
    ) =>
      write(
        (journal) => mutatePosition(journal, command, uploads),
        uploads,
        true,
      ),
    updatePlan,
    updatePlaybook,
    updateBacktest,
    updateTradeLinks: (
      command: TradeLinkCommand,
      uploads = new Map<string, Uint8Array>(),
    ) =>
      write(
        (journal) => mutateTradeLinks(journal, command, uploads),
        uploads,
        true,
      ),
    updateTrash: (command: TrashCommand) =>
      write(
        (journal) => mutateTrash(journal, command),
        undefined,
        command.action === TRASH_ACTION.PURGE,
      ),
    updateAccount: (command: AccountCommand) =>
      write((journal) => mutateAccount(journal, command)),
    updateWorkspace: (
      command: WorkspaceCommand,
      uploads = new Map<string, Uint8Array>(),
    ) =>
      write((journal) => mutateWorkspace(journal, command, uploads), uploads),
    readScreenshot,
  };
}
