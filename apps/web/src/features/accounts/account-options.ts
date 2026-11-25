import { tradeAccountKey } from "@liquidation/domain/trades/trade-tags";
import { useMemo } from "react";
import { useJournal } from "../journal/data/store.ts";
import { useAccountMessages } from "./messages.ts";

export function useAccountOptions() {
  const m = useAccountMessages();
  const accounts = useJournal((state) => state.accounts);
  const trades = useJournal((state) => state.trades);
  const positions = useJournal((state) => state.positions);
  return useMemo(() => {
    const labels = new Map(
      [...(trades ?? []), ...positions].map((record) => [
        tradeAccountKey(record),
        record.account ?? m.unassigned,
      ]),
    );
    for (const account of accounts)
      labels.set(
        account.id,
        account.name + (account.archived ? " · " + m.archived : ""),
      );
    return [...labels]
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [accounts, trades, positions, m.unassigned, m.archived]);
}
