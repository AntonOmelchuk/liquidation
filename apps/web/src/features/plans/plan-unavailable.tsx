import { PAGE_HASHES } from "../../app/constants.ts";

import { JournalUnavailable } from "../journal/journal-unavailable.tsx";
import { usePlanMessages } from "./messages.ts";

export function PlanUnavailable() {
  const p = usePlanMessages();
  return (
    <JournalUnavailable
      backHref={PAGE_HASHES.plans}
      backLabel={p.back}
      missing={p.missing}
      loadError={p.loadError}
    />
  );
}
