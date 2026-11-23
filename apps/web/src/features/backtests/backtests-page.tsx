import {
  backtestResults,
  sampleResult,
} from "@liquidation/domain/backtests/backtest";
import { realizedR } from "@liquidation/domain/trades/trade";
import { useState } from "react";
import { NEW_BACKTEST_HREF, PAGE_HASHES } from "../../app/constants.ts";
import { backtestHref, playbookHref } from "../../app/page.ts";
import { EMPTY_VALUE, NEW_DRAFT } from "../../shared/constants.ts";
import { numericTone } from "../../shared/format.ts";
import { useLocale } from "../../shared/messages.ts";
import { ScreenshotGallery } from "../../shared/screenshots/screenshot-gallery.tsx";
import { InstrumentIcons } from "../../shared/ui/instrument-picker.tsx";
import { Metric, Panel } from "../../shared/ui/layout.tsx";
import { JOURNAL_STATUS } from "../journal/data/constants.ts";
import { useJournal } from "../journal/data/store.ts";
import { JournalUnavailable } from "../journal/journal-unavailable.tsx";
import { BacktestSampleForm } from "./backtest-sample-form.tsx";
import { useBacktestMessages } from "./messages.ts";
import type { BacktestComparisonProps, BacktestMetricsProps } from "./types.ts";

function BacktestMetrics({ samples }: BacktestMetricsProps) {
  const { t, format } = useLocale();
  const b = useBacktestMessages();
  const result = backtestResults(samples);
  return (
    <div className="metrics">
      <Metric label={b.samples} value={format.integer.format(result.count)} />
      <Metric
        label={t.win}
        value={
          result.winRate === null
            ? EMPTY_VALUE
            : format.percentage.format(result.winRate)
        }
      />
      <Metric
        label={t.result}
        value={
          result.totalR === null
            ? EMPTY_VALUE
            : `${format.money.format(result.totalR)} R`
        }
      />
    </div>
  );
}

export function BacktestsPage() {
  const { t } = useLocale();
  const b = useBacktestMessages();
  const entries = useJournal((state) => state.backtests);
  const status = useJournal((state) => state.status);
  if (status !== JOURNAL_STATUS.READY)
    return (
      <JournalUnavailable
        backHref={PAGE_HASHES.journal}
        backLabel={t.backJournal}
        missing={b.missing}
      />
    );

  return (
    <main>
      <header className="page-heading">
        <h1>{b.title}</h1>
        <a className="action-link" href={NEW_BACKTEST_HREF}>
          ＋ {b.new}
        </a>
      </header>
      {entries.length ? (
        <div className="record-card-grid">
          {entries
            .toSorted(
              (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
            )
            .map((run) => (
              <Panel
                key={run.id}
                title={run.title}
                detail={
                  <a className="record-link" href={backtestHref(run.id)}>
                    {b.open}
                  </a>
                }
              >
                {run.thesis && <p className="record-prose">{run.thesis}</p>}
                <BacktestMetrics samples={run.samples} />
              </Panel>
            ))}
        </div>
      ) : (
        <p>{b.empty}</p>
      )}
    </main>
  );
}

function BacktestComparison({ run, trades }: BacktestComparisonProps) {
  const { t, format } = useLocale();
  const b = useBacktestMessages();
  const result = backtestResults(run.samples);
  const knownR = trades.flatMap((trade) => {
    const r = realizedR(trade);
    return r === null ? [] : [r];
  });
  const actualTotal = knownR.reduce((total, value) => total + value, 0);
  const average = (value: number | null) =>
    value === null ? EMPTY_VALUE : format.money.format(value);
  const rows = [
    {
      label: b.backtest,
      count: result.count,
      measured: result.count,
      totalR: result.totalR,
      mean: result.expectancyR,
    },
    {
      label: b.actual,
      count: trades.length,
      measured: knownR.length,
      totalR: knownR.length ? actualTotal : null,
      mean: knownR.length ? actualTotal / knownR.length : null,
    },
  ];

  return (
    <Panel title={b.comparison}>
      <div className="table">
        <table>
          <thead>
            <tr>
              <th scope="col">{b.source}</th>
              <th scope="col">{t.count}</th>
              <th scope="col">{b.measured}</th>
              <th scope="col">{t.result}</th>
              <th scope="col">{b.expectancy}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ label, count, measured, totalR, mean }) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                <td>{format.integer.format(count)}</td>
                <td>{format.integer.format(measured)}</td>
                <td>{average(totalR)}</td>
                <td>{average(mean)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export function BacktestDetailsPage({ id }: { id: string }) {
  const { t, format } = useLocale();
  const b = useBacktestMessages();
  const run = useJournal((state) =>
    state.backtests.find((entry) => entry.id === id),
  );
  const book = useJournal((state) =>
    state.playbooks.find((entry) => entry.id === run?.playbook?.id),
  );
  const trades = useJournal((state) => state.trades);
  const [editing, setEditing] = useState<string | null>(null);
  const finish = () => setEditing(null);
  if (!run)
    return (
      <JournalUnavailable
        backHref={PAGE_HASHES.backtests}
        backLabel={b.back}
        missing={b.missing}
      />
    );

  const attached = run.playbook;
  const actual = attached
    ? (trades ?? []).filter(
        ({ playbook }) =>
          playbook?.id === attached.id && playbook.version === attached.version,
      )
    : [];
  return (
    <main className="playbook-detail-page">
      <a className="record-back" href={PAGE_HASHES.backtests}>
        ← {b.back}
      </a>
      <header className="page-heading plan-detail-heading">
        <div>
          <h1>{run.title}</h1>
          {book && attached && (
            <a className="record-link" href={playbookHref(book.id)}>
              {book.title} · v{attached.version}
            </a>
          )}
        </div>
        <a className="action-link" href={backtestHref(id, true)}>
          {b.edit}
        </a>
      </header>
      <BacktestMetrics samples={run.samples} />
      <div className="layout">
        {run.thesis && (
          <Panel title={b.thesis}>
            <p className="record-prose">{run.thesis}</p>
          </Panel>
        )}
        {attached && <BacktestComparison run={run} trades={actual} />}
        <Panel
          title={b.samples}
          detail={
            <button
              className="secondary"
              type="button"
              disabled={editing !== null}
              onClick={() => setEditing(NEW_DRAFT)}
            >
              {b.addSample}
            </button>
          }
        >
          {editing === NEW_DRAFT && (
            <BacktestSampleForm run={run} finish={finish} />
          )}
          {run.samples.length ? (
            <ol className="plan-timeline">
              {run.samples
                .toSorted(
                  (a, b) => Date.parse(b.openedAt) - Date.parse(a.openedAt),
                )
                .map((sample) => {
                  const result = sampleResult(sample);
                  return (
                    <li key={sample.id}>
                      <div className="plan-actions">
                        <span className="instrument-label">
                          <InstrumentIcons symbol={sample.symbol} />
                          <strong>{sample.symbol}</strong>
                        </span>
                        <span>{t[sample.direction]}</span>
                        {sample.timeframe && <span>{sample.timeframe}</span>}
                        <time dateTime={sample.openedAt}>
                          {format.date.format(Date.parse(sample.openedAt))}
                        </time>
                        <strong className={numericTone(result)}>
                          {format.money.format(result)} R
                        </strong>
                        {editing === null && (
                          <button
                            className="secondary"
                            type="button"
                            onClick={() => setEditing(sample.id)}
                          >
                            {b.editSample}
                          </button>
                        )}
                      </div>
                      {editing === sample.id ? (
                        <BacktestSampleForm
                          run={run}
                          sample={sample}
                          finish={finish}
                        />
                      ) : (
                        <>
                          <dl className="playbook-facts">
                            <div>
                              <dt>{b.entryPrice}</dt>
                              <dd>{format.price.format(sample.entry)}</dd>
                            </div>
                            <div>
                              <dt>{b.stopPrice}</dt>
                              <dd>{format.price.format(sample.stop)}</dd>
                            </div>
                            <div>
                              <dt>{b.exitPrice}</dt>
                              <dd>{format.price.format(sample.exit)}</dd>
                            </div>
                            <div>
                              <dt>{b.costsR}</dt>
                              <dd>{format.money.format(sample.costsR)} R</dd>
                            </div>
                          </dl>
                          {sample.notes && <p>{sample.notes}</p>}
                          <ScreenshotGallery ids={sample.screenshotIds} />
                        </>
                      )}
                    </li>
                  );
                })}
            </ol>
          ) : (
            !editing && <p>{b.noSamples}</p>
          )}
        </Panel>
      </div>
    </main>
  );
}
