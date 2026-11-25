import { useMemo } from "react";
import { useJournal } from "../journal/data/store.ts";

export function useAccountSource() {
  const trades = useJournal((state) => state.trades);
  const positions = useJournal((state) => state.positions);
  const movements = useJournal((state) => state.movements);
  return useMemo(
    () => ({ trades: trades ?? [], positions, movements }),
    [trades, positions, movements],
  );
}
