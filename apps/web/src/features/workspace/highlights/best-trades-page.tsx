import { TRASH_KIND } from "@liquidation/domain/journal/trash/constants";
import { trashedRecords } from "@liquidation/domain/journal/trash/trash";
import { useMemo, useState } from "react";
import { PAGE_VIEW } from "../../../app/constants.ts";
import { highlightHref } from "../../../app/page.ts";
import { Panel } from "../../../shared/ui/layout.tsx";
import { JOURNAL_STATUS } from "../../journal/data/constants.ts";
import { useAllKnownPlaybooks } from "../../journal/data/references.ts";
import { useJournal } from "../../journal/data/store.ts";
import { JournalUnavailable } from "../../journal/journal-unavailable.tsx";
import { useWorkspaceMessages } from "../messages.ts";
import { HighlightDetailsPage } from "./highlight-details.tsx";
import { HighlightEditor } from "./highlight-editor.tsx";
import { highlightSummary } from "./highlight-summary.ts";
import { HighlightTable } from "./highlight-table.tsx";
import { useHighlightMessages } from "./messages.ts";
import { TradePicker } from "./trade-picker.tsx";
import type { BestTradesPageProps, HighlightRecord } from "./types.ts";
import "../workspace.css";
import "./highlights.css";

export default function BestTradesPage(props: BestTradesPageProps) {
  const m = useWorkspaceMessages();
  const h = useHighlightMessages();
  const ready = useJournal((state) => state.status === JOURNAL_STATUS.READY);
  const highlights = useJournal((state) => state.workspace.highlights);
  const trades = useJournal((state) => state.trades);
  const trash = useJournal((state) => state.trash);
  const books = useAllKnownPlaybooks();
  const tradeById = useMemo(
    () =>
      new Map(
        [...trashedRecords(trash, TRASH_KIND.TRADE), ...(trades ?? [])].map(
          (trade) => [trade.id, trade],
        ),
      ),
    [trades, trash],
  );
  const booksById = useMemo(
    () => new Map(books.map((book) => [book.id, book])),
    [books],
  );
  const rows = useMemo(() => {
    const deleted = new Set(
      trashedRecords(trash, TRASH_KIND.TRADE).map(({ id }) => id),
    );
    return highlights
      .filter(({ featured }) => featured)
      .toReversed()
      .map((entry): HighlightRecord => {
        const trade = tradeById.get(entry.id);
        const book = trade?.playbook && booksById.get(trade.playbook.id);
        return {
          entry,
          trade,
          tradeInTrash: deleted.has(entry.id),
          details: highlightSummary(entry, trade, book),
        };
      })
      .sort((a, b) =>
        (b.details.date ?? "").localeCompare(a.details.date ?? ""),
      );
  }, [booksById, highlights, tradeById, trash]);

  const id = "id" in props ? props.id : undefined;
  const entry = id ? highlights.find((item) => item.id === id) : undefined;
  const trade = id ? tradeById.get(id) : undefined;
  const row = rows.find((item) => item.entry.id === id);
  const usableTrade =
    id &&
    trades?.some((item) => item.id === id) &&
    !trash.some(
      (item) => item.kind === TRASH_KIND.HIGHLIGHT && item.value.id === id,
    );
  if (
    !ready ||
    (props.view === PAGE_VIEW.DETAILS && !row) ||
    (props.view === PAGE_VIEW.EDIT && !entry && !usableTrade)
  ) {
    return (
      <JournalUnavailable
        backHref={highlightHref()}
        backLabel={m.bestTrades}
        missing={h.missing}
      />
    );
  }
  if (props.view === PAGE_VIEW.DETAILS && row)
    return <HighlightDetailsPage {...row} />;
  if (props.view === PAGE_VIEW.NEW || props.view === PAGE_VIEW.EDIT) {
    const book = trade?.playbook && booksById.get(trade.playbook.id);
    return (
      <HighlightEditor
        key={id ?? PAGE_VIEW.NEW}
        trade={trade}
        entry={entry}
        details={highlightSummary(entry, trade, book)}
      />
    );
  }

  return <BestTradesList rows={rows} />;
}

function BestTradesList({ rows }: { rows: readonly HighlightRecord[] }) {
  const m = useWorkspaceMessages();
  const trades = useJournal((state) => state.trades);
  const trash = useJournal((state) => state.trash);
  const [picking, setPicking] = useState(false);
  const available = useMemo(() => {
    const excluded = new Set([
      ...rows.map(({ entry }) => entry.id),
      ...trashedRecords(trash, TRASH_KIND.HIGHLIGHT).map(({ id }) => id),
    ]);
    return trades?.filter(({ id }) => !excluded.has(id)) ?? [];
  }, [trades, rows, trash]);

  return (
    <main className="workspace-page">
      <div className="page-heading">
        <h1>{m.bestTrades}</h1>
        <div className="workspace-actions">
          <button
            type="button"
            className="secondary"
            disabled={picking}
            onClick={() => setPicking(true)}
          >
            {m.addFromJournal}
          </button>
          <a className="action-link" href={highlightHref(PAGE_VIEW.NEW)}>
            ＋ {m.newExample}
          </a>
        </div>
      </div>
      <div className="layout">
        {picking && (
          <TradePicker
            trades={available}
            onSelect={(id) => {
              window.location.hash = highlightHref(id, true);
            }}
            onCancel={() => setPicking(false)}
          />
        )}
        <Panel title={m.featured} detail={rows.length}>
          {rows.length ? <HighlightTable rows={rows} /> : <p>{m.noFeatured}</p>}
        </Panel>
      </div>
    </main>
  );
}
