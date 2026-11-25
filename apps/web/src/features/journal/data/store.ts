import type { Journal } from "@liquidation/domain/journal/types";
import { DEFAULT_CURRENCY } from "@liquidation/domain/accounts/constants";
import { workspaceSchema } from "@liquidation/domain/workspace/workspace";
import { create } from "zustand";
import { JOURNAL_STATUS } from "./constants.ts";
import type { JournalState } from "./types.ts";

import {
  loadJournal,
  saveAccount,
  saveBacktest,
  savePlan,
  savePlaybook,
  savePosition,
  saveTrade,
  saveTrash,
  saveTradeLinks,
  saveWorkspace,
} from "./api.ts";

export const useJournal = create<JournalState>((set, get) => {
  let pending = Promise.resolve();

  function enqueue(operation: () => Promise<void>) {
    const next = pending.then(operation);
    pending = next.catch(() => undefined);
    return next;
  }

  function applySnapshot({
    currency,
    accounts,
    movements,
    trades,
    positions,
    plans,
    playbooks,
    backtests,
    workspace,
    trash,
  }: Journal) {
    set({
      currency,
      accounts,
      movements,
      trades,
      positions,
      plans,
      playbooks,
      backtests,
      workspace,
      trash,
      status: JOURNAL_STATUS.READY,
    });
  }

  return {
    currency: DEFAULT_CURRENCY,
    accounts: [],
    movements: [],
    trades: null,
    positions: [],
    plans: [],
    playbooks: [],
    backtests: [],
    workspace: workspaceSchema.parse({}),
    trash: [],
    status: JOURNAL_STATUS.IDLE,
    async load() {
      const { status } = get();
      if (status === JOURNAL_STATUS.LOADING || status === JOURNAL_STATUS.READY)
        return;
      set({ status: JOURNAL_STATUS.LOADING });
      await enqueue(async () => {
        try {
          applySnapshot(await loadJournal());
        } catch {
          set({ status: JOURNAL_STATUS.ERROR });
        }
      });
    },
    refreshJournal() {
      return enqueue(async () => {
        applySnapshot(await loadJournal());
      });
    },
    updatePosition(command, uploads) {
      return enqueue(async () =>
        applySnapshot(await savePosition(command, uploads)),
      );
    },
    updatePlan(command, uploads) {
      return enqueue(async () =>
        applySnapshot(await savePlan(command, uploads)),
      );
    },
    updatePlaybook(command, uploads) {
      return enqueue(async () =>
        applySnapshot(await savePlaybook(command, uploads)),
      );
    },
    updateBacktest(command, uploads) {
      return enqueue(async () =>
        applySnapshot(await saveBacktest(command, uploads)),
      );
    },
    updateTradeLinks(command, uploads) {
      return enqueue(async () =>
        applySnapshot(await saveTradeLinks(command, uploads)),
      );
    },
    updateWorkspace(command, uploads) {
      return enqueue(async () =>
        applySnapshot(await saveWorkspace(command, uploads)),
      );
    },
    updateTrash(command) {
      return enqueue(async () => applySnapshot(await saveTrash(command)));
    },
    updateAccount(command) {
      return enqueue(async () => applySnapshot(await saveAccount(command)));
    },
    record(input, uploads) {
      return enqueue(async () => {
        const trade = await saveTrade(input, uploads);
        set(({ trades }) => ({ trades: [trade, ...(trades ?? [])] }));
      });
    },
  };
});
