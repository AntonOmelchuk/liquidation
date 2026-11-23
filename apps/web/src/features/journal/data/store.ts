import type { Journal } from "@liquidation/domain/journal/types";
import { create } from "zustand";
import { JOURNAL_STATUS } from "./constants.ts";
import type { JournalState } from "./types.ts";

import {
  loadJournal,
  saveBacktest,
  savePlan,
  savePlaybook,
  savePosition,
  saveTrade,
  saveTradeLinks,
} from "./api.ts";

export const useJournal = create<JournalState>((set, get) => {
  let pending = Promise.resolve();

  function enqueue(operation: () => Promise<void>) {
    const next = pending.then(operation);
    pending = next.catch(() => undefined);
    return next;
  }

  function applySnapshot({
    trades,
    positions,
    plans,
    playbooks,
    backtests,
  }: Journal) {
    set({
      trades,
      positions,
      plans,
      playbooks,
      backtests,
      status: JOURNAL_STATUS.READY,
    });
  }

  return {
    trades: null,
    positions: [],
    plans: [],
    playbooks: [],
    backtests: [],
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
    refreshPlaybooks() {
      return enqueue(async () => {
        const { playbooks } = await loadJournal();
        set({ playbooks });
      });
    },
    updatePosition(command) {
      return enqueue(async () => applySnapshot(await savePosition(command)));
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
    updateTradeLinks(command) {
      return enqueue(async () => applySnapshot(await saveTradeLinks(command)));
    },
    record(input) {
      return enqueue(async () => {
        const trade = await saveTrade(input);
        set(({ trades }) => ({ trades: [trade, ...(trades ?? [])] }));
      });
    },
  };
});
