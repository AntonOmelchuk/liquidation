import type { StoredJournal } from "@liquidation/domain/journal/types";

export function splitJournalSnapshot({
  releaseObservations,
  ...records
}: StoredJournal) {
  return { records, releaseObservations };
}
