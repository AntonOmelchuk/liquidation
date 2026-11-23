import type { BacktestCommand } from "@liquidation/domain/backtests/types";
import type { PlanCommand } from "@liquidation/domain/plans/types";
import type { PlaybookCommand } from "@liquidation/domain/playbooks/types";
import type {
  PositionCommand,
  TradeLinkCommand,
} from "@liquidation/domain/trades/types";
import { homedir } from "node:os";
import { join } from "node:path";

import type { TradeInput } from "@liquidation/domain/trades/types";
import { mutateBacktest } from "./records/backtest-records.ts";
import { mutatePlan } from "./records/plan-records.ts";
import { mutatePlaybook } from "./records/playbook-records.ts";
import {
  appendTrade,
  mutatePosition,
  mutateTradeLinks,
} from "./records/trade-records.ts";
import { createJournalStorage } from "./storage/journal-store.ts";

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
    append: (input: TradeInput) =>
      write((journal) => appendTrade(journal, input)),
    updatePosition: (command: PositionCommand) =>
      write((journal) => mutatePosition(journal, command)),
    updatePlan,
    updatePlaybook,
    updateBacktest,
    updateTradeLinks: (command: TradeLinkCommand) =>
      write((journal) => mutateTradeLinks(journal, command)),
    readScreenshot,
  };
}
