import { TRASH_KIND } from "@liquidation/domain/journal/trash/constants";
import { useMemo, useState } from "react";
import { PAGE_HASHES } from "../../../app/constants.ts";
import { tradeLinksHref } from "../../../app/page.ts";
import { useLocale } from "../../../shared/messages.ts";
import { ScreenshotGallery } from "../../../shared/screenshots/screenshot-gallery.tsx";
import { Panel } from "../../../shared/ui/layout.tsx";
import { JOURNAL_STATUS } from "../../journal/data/constants.ts";
import { useJournal } from "../../journal/data/store.ts";
import { DeleteRecord } from "../../trash/delete-record.tsx";
import { useTrashMessages } from "../../trash/messages.ts";
import { JournalUnavailable } from "../../journal/journal-unavailable.tsx";
import { useWorkspaceMessages } from "../messages.ts";
import { SubjectResult } from "../reports/assessment-fields.tsx";
import { HIGHLIGHT_FLOW } from "./constants.ts";
import { HighlightEditor } from "./highlight-editor.tsx";
import { TradePicker } from "./trade-picker.tsx";
import type { HighlightDraft } from "./types.ts";
import "../workspace.css";

export default function BestTradesPage() {
  const { t, format } = useLocale();
  const m = useWorkspaceMessages();
  const deleted = useTrashMessages().deleted;
  const trades = useJournal((state) => state.trades);
  const ready = useJournal((state) => state.status === JOURNAL_STATUS.READY);
  const highlights = useJournal((state) => state.workspace.highlights);
  const trash = useJournal((state) => state.trash);
  const [draft, setDraft] = useState<HighlightDraft>();
  const [saved, setSaved] = useState(false);

  const featured = highlights.filter((entry) => entry.featured);
  const tradeById = useMemo(
    () =>
      new Map([
        ...trash.flatMap((entry) =>
          entry.kind === TRASH_KIND.TRADE
            ? [[entry.value.id, entry.value] as const]
            : [],
        ),
        ...(trades ?? []).map((trade) => [trade.id, trade] as const),
      ]),
    [trades, trash],
  );
  const available = useMemo(() => {
    const excluded = new Set(
      highlights.filter((entry) => entry.featured).map((entry) => entry.id),
    );
    for (const entry of trash)
      if (entry.kind === TRASH_KIND.HIGHLIGHT) excluded.add(entry.value.id);
    return trades?.filter((trade) => !excluded.has(trade.id)) ?? [];
  }, [trades, highlights, trash]);
  const editingId = draft?.mode === HIGHLIGHT_FLOW.EDIT ? draft.id : undefined;

  function edit(id?: string) {
    setSaved(false);
    setDraft({ mode: HIGHLIGHT_FLOW.EDIT, id });
  }

  function close(success?: boolean) {
    setDraft(undefined);
    setSaved(Boolean(success));
  }

  if (!ready) {
    return (
      <JournalUnavailable
        backHref={PAGE_HASHES.journal}
        backLabel={t.backJournal}
        missing={m.noFeatured}
      />
    );
  }

  return (
    <main className="workspace-page">
      <div className="page-heading">
        <h1>{m.bestTrades}</h1>
        <div className="workspace-actions">
          <button
            type="button"
            className="secondary"
            disabled={Boolean(draft)}
            onClick={() => {
              setSaved(false);
              setDraft({ mode: HIGHLIGHT_FLOW.PICK });
            }}
          >
            {m.addFromJournal}
          </button>
          <button
            type="button"
            disabled={Boolean(draft)}
            onClick={() => edit()}
          >
            ＋ {m.newExample}
          </button>
        </div>
      </div>
      <div className="layout">
        {draft?.mode === HIGHLIGHT_FLOW.PICK && (
          <TradePicker trades={available} onSelect={edit} onCancel={close} />
        )}
        {draft?.mode === HIGHLIGHT_FLOW.EDIT && (
          <HighlightEditor
            key={editingId ?? HIGHLIGHT_FLOW.EDIT}
            trade={editingId ? tradeById.get(editingId) : undefined}
            entry={highlights.find(({ id }) => id === editingId)}
            onClose={close}
          />
        )}
        {saved && (
          <p className="positive" role="status">
            {m.saved}
          </p>
        )}
        <Panel title={m.featured} detail={featured.length}>
          {featured.length === 0 ? (
            <p>{m.noFeatured}</p>
          ) : (
            <div className="workspace-example-grid">
              {featured.toReversed().map((entry) => {
                const trade = tradeById.get(entry.id);
                const active = trades?.some(({ id }) => id === entry.id);
                return (
                  <article key={entry.id} className="workspace-example">
                    <div className="panel-heading">
                      <h3>
                        {trade && active ? (
                          <a
                            className="record-link"
                            href={tradeLinksHref(trade.id)}
                          >
                            {trade.symbol} · {t[trade.direction]}
                          </a>
                        ) : trade ? (
                          <>
                            {trade.symbol} · {deleted}
                          </>
                        ) : (
                          (entry.example?.title ?? m.exampleSource)
                        )}
                      </h3>
                      {trade && <SubjectResult subject={trade} />}
                    </div>
                    {trade ? (
                      <small>
                        {format.date.format(Date.parse(trade.closedAt))}
                      </small>
                    ) : (
                      entry.example?.symbol && (
                        <small>{entry.example.symbol}</small>
                      )
                    )}
                    {entry.note && <p className="record-prose">{entry.note}</p>}
                    <ScreenshotGallery ids={entry.screenshotIds} />
                    <button
                      type="button"
                      className="secondary"
                      disabled={Boolean(draft)}
                      onClick={() => edit(entry.id)}
                    >
                      {m.edit}
                    </button>
                    <DeleteRecord
                      kind={TRASH_KIND.HIGHLIGHT}
                      recordKey={entry.id}
                      revision={entry.revision}
                      disabled={Boolean(draft)}
                    />
                  </article>
                );
              })}
            </div>
          )}
        </Panel>
      </div>
    </main>
  );
}
