import { TRASH_KIND } from "@liquidation/domain/journal/trash/constants";
import { highlightHref, tradeLinksHref } from "../../../app/page.ts";
import { ScreenshotGallery } from "../../../shared/screenshots/screenshot-gallery.tsx";
import { TradeSideBadge } from "../../../shared/ui/direction-badge.tsx";
import { InstrumentIcons } from "../../../shared/ui/instrument-picker.tsx";
import { Panel } from "../../../shared/ui/layout.tsx";
import { DeleteRecord } from "../../trash/delete-record.tsx";
import { useTrashMessages } from "../../trash/messages.ts";
import { useWorkspaceMessages } from "../messages.ts";
import { HIGHLIGHT_COLUMNS } from "./constants.ts";
import { useHighlightValues } from "./highlight-values.tsx";
import { useHighlightMessages } from "./messages.ts";
import type { HighlightRecord } from "./types.ts";

export function HighlightDetailsPage({
  entry,
  trade,
  tradeInTrash,
  details,
}: HighlightRecord) {
  const m = useWorkspaceMessages();
  const h = useHighlightMessages();
  const d = useTrashMessages();
  const values = useHighlightValues(details);
  const symbol = trade?.symbol ?? entry.example?.symbol;
  return (
    <main className="workspace-page highlight-document">
      <a className="record-back" href={highlightHref()}>
        ← {m.bestTrades}
      </a>
      <div className="page-heading">
        <div>
          <h1 className="instrument-label">
            {symbol && <InstrumentIcons symbol={symbol} />}
            {entry.example?.title ?? symbol ?? m.exampleSource}
          </h1>
          {trade && <TradeSideBadge side={trade.direction} />}
          {tradeInTrash && <small>{d.deleted}</small>}
        </div>
        <div className="workspace-actions">
          <DeleteRecord
            kind={TRASH_KIND.HIGHLIGHT}
            recordKey={entry.id}
            revision={entry.revision}
            afterDelete={() => {
              window.location.hash = highlightHref();
            }}
          />
          <a
            className="action-link secondary"
            href={highlightHref(entry.id, true)}
          >
            {m.edit}
          </a>
          {trade && !tradeInTrash && (
            <a className="record-link" href={tradeLinksHref(trade.id)}>
              {h.viewJournalTrade} ↗
            </a>
          )}
        </div>
      </div>
      <div className="layout">
        <Panel title={h.tradeDetails}>
          <dl className="highlight-facts">
            {(["date", ...HIGHLIGHT_COLUMNS] as const).map((field) => (
              <div key={field}>
                <dt>{h[field]}</dt>
                <dd>{values[field]}</dd>
              </div>
            ))}
          </dl>
          {entry.note && <p className="record-prose">{entry.note}</p>}
          <ScreenshotGallery ids={entry.screenshotIds} />
        </Panel>
        {Boolean(entry.analysis?.length) && (
          <Panel title={h.analysis}>
            <div className="layout">
              {entry.analysis?.map(({ id, timeframe, text, screenshotIds }) => (
                <details className="highlight-analysis" key={id} open>
                  <summary>{timeframe}</summary>
                  {text && <p className="record-prose">{text}</p>}
                  <ScreenshotGallery ids={screenshotIds} />
                </details>
              ))}
            </div>
          </Panel>
        )}
      </div>
    </main>
  );
}
