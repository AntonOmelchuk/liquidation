import { DateText } from "../../../shared/ui/date-text.tsx";
import { netCents, realizedR } from "@liquidation/domain/trades/trade";
import { EMPTY_VALUE } from "../../../shared/constants.ts";
import { HTTP_STATUS } from "@liquidation/domain/journal/constants";
import { TRASH_KIND } from "@liquidation/domain/journal/trash/constants";
import { DeleteRecord } from "../../trash/delete-record.tsx";
import {
  tradeLinkCommand,
  tradeLinksSchema,
} from "@liquidation/domain/trades/trade-links";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { PAGE_HASHES } from "../../../app/constants.ts";
import type { TradeLinksEditorProps } from "./types.ts";

import { isoToLocalDateTime, numericTone } from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import { TradeSideBadge } from "../../../shared/ui/direction-badge.tsx";
import { InstrumentIcons } from "../../../shared/ui/instrument-picker.tsx";
import { Panel, RecordActions } from "../../../shared/ui/layout.tsx";
import { MetricCard, MetricGrid } from "../../../shared/ui/metric-card.tsx";
import { METRIC_TONE } from "../../../shared/ui/metric-constants.ts";
import { JournalRequestError } from "../data/api.ts";
import { useJournal } from "../data/store.ts";
import { JournalUnavailable } from "../journal-unavailable.tsx";
import { MistakeReviewFields } from "../../mistakes/review-fields.tsx";
import { useMistakeMessages } from "../../mistakes/messages.ts";
import { useTradeRecordMessages } from "./messages.ts";
import {
  readTradeEvidence,
  TradeEvidenceFields,
  tradeEvidenceUploads,
  useTradeEvidence,
} from "./trade-evidence-fields.tsx";
import { readTradeLinks, TradeLinkFields } from "./trade-link-fields.tsx";

function TradeLinksEditor({ trade }: TradeLinksEditorProps) {
  const { t, format } = useLocale();
  const m = useTradeRecordMessages();
  const mistakes = useMistakeMessages();
  const { draft, setDraft } = useTradeEvidence(trade);
  const [previous] = useState(() => tradeLinksSchema.parse(trade));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const updateLinks = useJournal((state) => state.updateTradeLinks);
  const currency = useJournal((state) => state.currency);
  const multiple = realizedR(trade);
  const net = netCents(trade) / 100;
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    heading.current?.focus({ preventScroll: true });
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const data = new FormData(event.currentTarget);
    const uploads = tradeEvidenceUploads(draft);
    if (!uploads) {
      setError(m.screenshotLimit);
      return;
    }
    const result = tradeLinkCommand.safeParse({
      id: trade.id,
      previous,
      next: { ...readTradeLinks(data), ...readTradeEvidence(draft) },
    });
    if (!result.success) {
      setError(t.linksError);
      return;
    }
    setSaving(true);
    setError(undefined);
    try {
      await updateLinks(result.data, uploads);
      window.location.replace(PAGE_HASHES.journal);
    } catch (failure) {
      setError(
        failure instanceof JournalRequestError &&
          failure.status === HTTP_STATUS.CONFLICT
          ? t.linksConflict
          : t.linksError,
      );
      setSaving(false);
    }
  }

  return (
    <main className="record-editor trade-editor">
      <a className="record-back" href={PAGE_HASHES.journal}>
        ← {t.backJournal}
      </a>
      <header className="page-heading plan-detail-heading">
        <div>
          <h1 ref={heading} tabIndex={-1}>
            {mistakes.reviewTrade}
          </h1>
          <div className="plan-detail-meta">
            <span className="instrument-label">
              <InstrumentIcons symbol={trade.symbol} />
              {trade.symbol}
            </span>
            <TradeSideBadge side={trade.direction} />
            <DateText value={trade.openedAt} withTime />
          </div>
        </div>
      </header>
      <div className="workspace-actions">
        <DeleteRecord
          kind={TRASH_KIND.TRADE}
          recordKey={trade.id}
          disabled={saving}
          afterDelete={() => {
            window.location.hash = PAGE_HASHES.journal;
          }}
        />
      </div>
      <MetricGrid label={m.financial} compact>
        <MetricCard
          label={t.pnl}
          value={format.money.format(net) + " " + currency}
          icon="WALLET"
          tone={numericTone(net)}
          featured
        />
        <MetricCard
          label={t.result}
          icon="TREND"
          tone={numericTone(multiple ?? 0) ?? METRIC_TONE.NEUTRAL}
          value={
            multiple === null
              ? EMPTY_VALUE
              : format.money.format(multiple) + " R"
          }
        />
        <MetricCard
          label={m.initialRisk}
          icon="WARNING"
          tone={trade.risk === null ? undefined : METRIC_TONE.CAUTION}
          detail={
            trade.riskSizing
              ? format.riskPercent.format(trade.riskSizing.percent / 100)
              : undefined
          }
          value={
            trade.risk === null
              ? EMPTY_VALUE
              : format.money.format(trade.risk) + " " + currency
          }
        />
        <MetricCard
          label={t.closed}
          value={format.date.format(Date.parse(trade.closedAt))}
          icon="CALENDAR"
          tone={METRIC_TONE.NEUTRAL}
        />
      </MetricGrid>
      {trade.notes && (
        <Panel title={t.notes}>
          <p className="record-prose">{trade.notes}</p>
        </Panel>
      )}
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
        <TradeEvidenceFields
          draft={draft}
          onChange={setDraft}
          closed
          disabled={saving}
        />
        <MistakeReviewFields initial={trade} disabled={saving} />
        <RecordActions
          backHref={PAGE_HASHES.journal}
          cancel={t.cancel}
          submit={saving ? t.saving : t.saveLinks}
          saving={saving}
          error={error}
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
