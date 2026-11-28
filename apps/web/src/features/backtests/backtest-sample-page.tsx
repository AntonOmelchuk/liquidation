import { sampleResult } from "@liquidation/domain/backtests/backtest";
import { backtestHref, backtestSampleHref } from "../../app/page.ts";
import { EMPTY_VALUE } from "../../shared/constants.ts";
import { numericTone } from "../../shared/format.ts";
import { useLocale } from "../../shared/messages.ts";
import { ScreenshotGallery } from "../../shared/screenshots/screenshot-gallery.tsx";
import { ICON_ACTION } from "../../shared/ui/constants.ts";
import { DateText } from "../../shared/ui/date-text.tsx";
import { TradeSideBadge } from "../../shared/ui/direction-badge.tsx";
import { IconAction } from "../../shared/ui/icon-action.tsx";
import { InstrumentLabel } from "../../shared/ui/instrument-label.tsx";
import { Panel, RecordHeading } from "../../shared/ui/layout.tsx";
import { MetricCard, MetricGrid } from "../../shared/ui/metric-card.tsx";
import { useJournal } from "../journal/data/store.ts";
import { JournalUnavailable } from "../journal/journal-unavailable.tsx";
import { BacktestSampleForm } from "./backtest-sample-form.tsx";
import { useBacktestMessages } from "./messages.ts";
import type { BacktestSamplePageProps } from "./types.ts";

export default function BacktestSamplePage({
  id,
  sampleId,
  editing,
}: BacktestSamplePageProps) {
  const { t, format } = useLocale();
  const b = useBacktestMessages();
  const run = useJournal((state) =>
    state.backtests.find((record) => record.id === id),
  );
  const sample = run?.samples.find((row) => row.id === sampleId);
  const back = backtestHref(id);
  if (!run || (sampleId && !sample))
    return (
      <JournalUnavailable
        backHref={back}
        backLabel={b.backToSession}
        missing={run ? b.sampleMissing : b.missing}
      />
    );
  if (editing) {
    const cancel = sample ? backtestSampleHref(id, sample.id) : back;
    return (
      <main>
        <RecordHeading
          title={sample ? b.editSample : b.addSample}
          backHref={cancel}
          backLabel={sample ? b.sampleDetail : b.backToSession}
        />
        <Panel title={run.title}>
          <BacktestSampleForm
            run={run}
            sample={sample}
            finish={(savedId) => {
              window.location.hash = savedId
                ? backtestSampleHref(id, savedId)
                : cancel;
            }}
          />
        </Panel>
      </main>
    );
  }
  if (!sample) return null;
  const r = sampleResult(sample);
  return (
    <main className="layout">
      <RecordHeading
        title={<InstrumentLabel symbol={sample.symbol} />}
        backHref={back}
        backLabel={b.backToSession}
        meta={
          <>
            <TradeSideBadge side={sample.direction} />
            <span>{sample.timeframe}</span>
            <DateText value={sample.openedAt} withTime />
          </>
        }
        actions={
          <IconAction
            icon={ICON_ACTION.EDIT}
            label={b.editSample}
            href={backtestSampleHref(id, sample.id, true)}
          />
        }
      />
      <MetricGrid compact>
        <MetricCard
          label={t.result}
          value={format.money.format(r) + " R"}
          icon="TREND"
          tone={numericTone(r)}
        />
        <MetricCard
          label={b.entryPrice}
          value={format.price.format(sample.entry)}
          icon="TARGET"
        />
        <MetricCard
          label={b.stopPrice}
          value={format.price.format(sample.stop)}
          icon="SCALE"
        />
        <MetricCard
          label={b.exitPrice}
          value={format.price.format(sample.exit)}
          icon="CLOCK"
          detail={<DateText value={sample.closedAt} withTime />}
        />
        <MetricCard
          label={b.costsR}
          value={format.money.format(sample.costsR) + " R"}
          icon="WALLET"
        />
      </MetricGrid>
      <Panel title={t.notes}>
        <p className="record-prose">{sample.notes || EMPTY_VALUE}</p>
        <ScreenshotGallery ids={sample.screenshotIds} />
      </Panel>
    </main>
  );
}
