import { TRASH_KIND } from "@liquidation/domain/journal/trash/constants";
import {
  deletedPlaybook,
  deletedPlan,
} from "@liquidation/domain/journal/trash/trash";
import { useMemo } from "react";
import { useJournal } from "./store.ts";

export function useHistoricalPlaybookOptions(id?: string) {
  const books = useJournal((state) => state.playbooks);
  const trash = useJournal((state) => state.trash);
  const previous = deletedPlaybook(trash, id);
  return previous ? [...books, previous] : books;
}

export function useHistoricalPlanOptions(id?: string) {
  const plans = useJournal((state) => state.plans);
  const trash = useJournal((state) => state.trash);
  const previous = deletedPlan(trash, id);
  return previous ? [...plans, previous] : plans;
}

export function useAllKnownPlaybooks() {
  const active = useJournal((state) => state.playbooks);
  const trash = useJournal((state) => state.trash);
  return useMemo(
    () => [
      ...active,
      ...trash.flatMap((entry) =>
        entry.kind === TRASH_KIND.PLAYBOOK ? [entry.value] : [],
      ),
    ],
    [active, trash],
  );
}
