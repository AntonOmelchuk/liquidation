import { indexWatchlistActivity } from "@liquidation/domain/workspace/watchlist-analytics";
import { useMemo } from "react";
import { useJournal } from "../../journal/data/store.ts";

export function useWatchlistActivity() {
  const trades = useJournal((state) => state.trades);
  const positions = useJournal((state) => state.positions);
  const missedTrades = useJournal((state) => state.workspace.missedTrades);
  const plans = useJournal((state) => state.plans);
  return useMemo(
    () =>
      indexWatchlistActivity({
        trades: trades ?? [],
        positions,
        missedTrades,
        plans,
      }),
    [trades, positions, missedTrades, plans],
  );
}
