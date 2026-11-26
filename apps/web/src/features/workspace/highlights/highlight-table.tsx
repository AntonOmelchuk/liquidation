import { TRASH_KIND } from "@liquidation/domain/journal/trash/constants";
import { highlightHref } from "../../../app/page.ts";
import { useLocale } from "../../../shared/messages.ts";
import { PencilIcon } from "../../../shared/ui/action-icons.tsx";
import { InstrumentIcons } from "../../../shared/ui/instrument-picker.tsx";
import { DeleteRecord } from "../../trash/delete-record.tsx";
import { useTrashMessages } from "../../trash/messages.ts";
import { useWorkspaceMessages } from "../messages.ts";
import { HIGHLIGHT_COLUMNS } from "./constants.ts";
import { useHighlightValues } from "./highlight-values.tsx";
import { useHighlightMessages } from "./messages.ts";
import type { HighlightRecord } from "./types.ts";

function HighlightRow({
  entry,
  trade,
  tradeInTrash,
  details,
}: HighlightRecord) {
  const m = useWorkspaceMessages();
  const d = useTrashMessages();
  const values = useHighlightValues(details);
  const symbol = trade?.symbol ?? entry.example?.symbol;
  const name = entry.example?.title ?? symbol ?? m.exampleSource;
  return (
    <tr>
      <td>{values.date}</td>
      <th scope="row">
        <a
          className="record-link instrument-label"
          href={highlightHref(entry.id)}
        >
          {symbol && <InstrumentIcons symbol={symbol} />}
          {symbol ?? name}
        </a>
        {symbol && name !== symbol && <small>{name}</small>}
        {tradeInTrash && <small>{d.deleted}</small>}
      </th>
      {HIGHLIGHT_COLUMNS.map((field) => (
        <td key={field} className={field}>
          {values[field]}
        </td>
      ))}
      <td>
        <div className="highlight-row-actions">
          <a
            className="action-link secondary icon-action"
            href={highlightHref(entry.id, true)}
            aria-label={m.edit + " · " + name}
            title={m.edit}
          >
            <PencilIcon />
          </a>
          <DeleteRecord
            kind={TRASH_KIND.HIGHLIGHT}
            recordKey={entry.id}
            revision={entry.revision}
            iconOnly
            recordLabel={name}
          />
        </div>
      </td>
    </tr>
  );
}

export function HighlightTable({ rows }: { rows: readonly HighlightRecord[] }) {
  const m = useWorkspaceMessages();
  const { t } = useLocale();
  const h = useHighlightMessages();
  return (
    <div
      className="table highlight-table"
      tabIndex={0}
      role="region"
      aria-label={m.featured}
    >
      <table>
        <thead>
          <tr>
            <th scope="col">{h.date}</th>
            <th scope="col">{t.symbol}</th>
            {HIGHLIGHT_COLUMNS.map((field) => (
              <th key={field} scope="col">
                {h[field]}
              </th>
            ))}
            <th scope="col">{h.actions}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <HighlightRow key={row.entry.id} {...row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
