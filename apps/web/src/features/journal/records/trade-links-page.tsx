import { HTTP_STATUS } from "@liquidation/domain/journal/constants";
import {
  tradeLinkCommand,
  tradeLinksSchema,
} from "@liquidation/domain/trades/trade-links";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { PAGE_HASHES } from "../../../app/constants.ts";
import type { TradeLinksEditorProps } from "./types.ts";

import { isoToLocalDateTime } from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import { InstrumentIcons } from "../../../shared/ui/instrument-picker.tsx";
import { Panel, RecordActions } from "../../../shared/ui/layout.tsx";
import { JournalRequestError } from "../data/api.ts";
import { useJournal } from "../data/store.ts";
import { JournalUnavailable } from "../journal-unavailable.tsx";
import { readTradeLinks, TradeLinkFields } from "./trade-link-fields.tsx";

function TradeLinksEditor({ trade }: TradeLinksEditorProps) {
  const { t, format } = useLocale();
  const [previous] = useState(() => tradeLinksSchema.parse(trade));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<"linksError" | "linksConflict">();
  const updateLinks = useJournal((state) => state.updateTradeLinks);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    heading.current?.focus({ preventScroll: true });
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const data = new FormData(event.currentTarget);
    const result = tradeLinkCommand.safeParse({
      id: trade.id,
      previous,
      next: readTradeLinks(data),
    });
    if (!result.success) {
      setError("linksError");
      return;
    }
    setSaving(true);
    setError(undefined);
    try {
      await updateLinks(result.data);
      window.location.replace(PAGE_HASHES.journal);
    } catch (failure) {
      setError(
        failure instanceof JournalRequestError &&
          failure.status === HTTP_STATUS.CONFLICT
          ? "linksConflict"
          : "linksError",
      );
      setSaving(false);
    }
  }

  return (
    <main className="record-editor">
      <a className="record-back" href={PAGE_HASHES.journal}>
        ← {t.backJournal}
      </a>
      <header className="page-heading plan-detail-heading">
        <div>
          <h1 ref={heading} tabIndex={-1}>
            {t.editTradeLinks}
          </h1>
          <div className="plan-detail-meta">
            <span className="instrument-label">
              <InstrumentIcons symbol={trade.symbol} />
              {trade.symbol}
            </span>
            <span>{t[trade.direction]}</span>
            <time dateTime={trade.openedAt}>
              {format.date.format(Date.parse(trade.openedAt))}
            </time>
          </div>
        </div>
      </header>
      <form className="layout" onSubmit={save}>
        <Panel title={t.tradeLinks}>
          <fieldset disabled={saving}>
            <TradeLinkFields
              openedAt={isoToLocalDateTime(trade.openedAt)}
              initial={previous}
              historic
              closed
            />
          </fieldset>
        </Panel>
        <RecordActions
          backHref={PAGE_HASHES.journal}
          cancel={t.cancel}
          submit={saving ? t.saving : t.saveLinks}
          saving={saving}
          error={error ? t[error] : undefined}
        />
      </form>
    </main>
  );
}

export function TradeLinksPage({ id }: { id: string }) {
  const { t } = useLocale();
  const trade = useJournal((state) =>
    state.trades?.find((item) => item.id === id),
  );
  if (!trade)
    return (
      <JournalUnavailable
        backHref={PAGE_HASHES.journal}
        backLabel={t.backJournal}
        missing={t.noTrade}
      />
    );
  return <TradeLinksEditor key={id} trade={trade} />;
}
