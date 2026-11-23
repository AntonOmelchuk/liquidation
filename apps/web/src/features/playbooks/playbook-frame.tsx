import type { PlaybookFrameProps } from "./types.ts";

import { playbookFrame } from "@liquidation/domain/playbooks/playbook-frame";
import { EMPTY_VALUE } from "../../shared/constants.ts";
import { useLocale } from "../../shared/messages.ts";
import { useJournal } from "../journal/data/store.ts";
import { usePlaybookMessages } from "./messages.ts";

export function PlaybookFrame({ book, context }: PlaybookFrameProps) {
  const b = usePlaybookMessages();
  const { format } = useLocale();
  const trades = useJournal((state) => state.trades);
  const positions = useJournal((state) => state.positions);
  const entry = context.openedAt ? new Date(context.openedAt) : new Date();
  if (Number.isNaN(entry.getTime())) return null;
  const { values, missingRisk } = playbookFrame(
    trades ?? [],
    positions,
    book.id,
    entry,
    context.risk,
    context.editingId,
  );
  const keys = (Object.keys(values) as (keyof typeof values)[]).filter(
    (name) => book.limits[name] !== undefined,
  );
  if (!keys.length) return null;

  return (
    <div className="wide limit-frame">
      <strong>{b.limitFrame}</strong>
      <dl className="playbook-facts">
        {keys.map((name) => {
          const limit = book.limits[name]!;
          const value = values[name];
          return (
            <div key={name}>
              <dt>{b[name]}</dt>
              <dd
                className={
                  value !== null && value > limit ? "negative" : undefined
                }
              >
                {value === null ? EMPTY_VALUE : format.price.format(value)} /{" "}
                {format.price.format(limit)}
              </dd>
            </div>
          );
        })}
      </dl>
      {book.limits.maxWeekLossR && missingRisk > 0 && (
        <small className="rule-detail">{b.weekMissingRisk}</small>
      )}
    </div>
  );
}
