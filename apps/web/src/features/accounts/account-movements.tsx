import { ICON_ACTION } from "../../shared/ui/constants.ts";
import { IconAction } from "../../shared/ui/icon-action.tsx";
import { TRASH_KIND } from "@liquidation/domain/journal/trash/constants";
import { useState } from "react";
import { numericTone } from "../../shared/format.ts";
import { useLocale } from "../../shared/messages.ts";
import { Panel } from "../../shared/ui/layout.tsx";
import { useJournal } from "../journal/data/store.ts";
import { DeleteRecord } from "../trash/delete-record.tsx";
import { useAccountMessages } from "./messages.ts";
import { MovementEditor } from "./movement-editor.tsx";
import type { AccountDetailsProps } from "./types.ts";

export function AccountMovements({ account }: AccountDetailsProps) {
  const m = useAccountMessages();
  const { t, format } = useLocale();
  const records = useJournal((state) => state.movements);
  const [draft, setDraft] = useState<{ id?: string }>();
  const movements = records
    .filter((record) => record.accountId === account.id)
    .toSorted((a, b) => Date.parse(b.at) - Date.parse(a.at));
  return (
    <Panel
      title={m.movements}
      detail={
        <button
          className="secondary"
          type="button"
          disabled={Boolean(draft)}
          onClick={() => setDraft({})}
        >
          ＋ {m.newMovement}
        </button>
      }
    >
      {draft && (
        <MovementEditor
          key={draft.id ?? "new"}
          account={account}
          movement={movements.find((record) => record.id === draft.id)}
          onClose={() => setDraft(undefined)}
        />
      )}
      {movements.length ? (
        <div className="table compact-record-table">
          <table aria-label={m.movements}>
            <thead>
              <tr>
                <th>{m.at}</th>
                <th>{m.movementKind}</th>
                <th>{m.amount}</th>
                <th>{t.notes}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {movements.map((record) => (
                <tr key={record.id}>
                  <td>{format.date.format(Date.parse(record.at))}</td>
                  <td>{m[record.kind]}</td>
                  <td className={numericTone(record.amount)}>
                    {format.money.format(record.amount)} {account.currency}
                  </td>
                  <td>{record.notes}</td>
                  <td>
                    <div className="workspace-actions">
                      <IconAction
                        icon={ICON_ACTION.EDIT}
                        label={m.editMovement}
                        disabled={Boolean(draft)}
                        onClick={() => setDraft({ id: record.id })}
                      />
                      <DeleteRecord
                        kind={TRASH_KIND.MOVEMENT}
                        recordKey={record.id}
                        revision={record.revision}
                        disabled={Boolean(draft)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>{m.noMovements}</p>
      )}
    </Panel>
  );
}
