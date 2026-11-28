import { ICON_ACTION } from "../../shared/ui/constants.ts";
import { IconAction } from "../../shared/ui/icon-action.tsx";
import { TRASH_KIND } from "@liquidation/domain/journal/trash/constants";
import { deletedPlaybook } from "@liquidation/domain/journal/trash/trash";
import { useTrashMessages } from "../trash/messages.ts";
import {
  backtestResults,
  sampleResult,
} from "@liquidation/domain/backtests/backtest";
import { realizedR } from "@liquidation/domain/trades/trade";
import { NEW_BACKTEST_HREF, PAGE_HASHES } from "../../app/constants.ts";
import {
  backtestHref,
  backtestSampleHref,
  playbookHref,
} from "../../app/page.ts";
import { SeriesChart } from "../../shared/analytics/series-chart.tsx";
import { EMPTY_VALUE } from "../../shared/constants.ts";
import { numericTone } from "../../shared/format.ts";
import { useLocale } from "../../shared/messages.ts";
import { Panel } from "../../shared/ui/layout.tsx";
import { MetricBar } from "../../shared/ui/metric-bar.tsx";
import { MetricCard, MetricGrid } from "../../shared/ui/metric-card.tsx";
import { METRIC_TONE } from "../../shared/ui/metric-constants.ts";
import { JOURNAL_STATUS } from "../journal/data/constants.ts";
import { useJournal } from "../journal/data/store.ts";
import { DeleteRecord } from "../trash/delete-record.tsx";
import { JournalUnavailable } from "../journal/journal-unavailable.tsx";
import { BacktestSamplesTable } from "./backtest-samples-table.tsx";
import { useBacktestMessages } from "./messages.ts";
import type { BacktestComparisonProps, BacktestMetricsProps } from "./types.ts";

function BacktestMetrics({ samples }: BacktestMetricsProps) {
  const { t, format } = useLocale();
  const b = useBacktestMessages();
  const result = backtestResults(samples);
  const ordered = samples.toSorted(
    (a, b) => Date.parse(a.openedAt) - Date.parse(b.openedAt),
  );
  let total = 0;
  const values = ordered.length
    ? [
        0,
        ...ordered.map((sample) => {
          total += sampleResult(sample);
          return total;
        }),
      ]
    : [];
  return (
    <MetricGrid compact>
      <MetricCard
        label={b.samples}
        value={format.integer.format(result.count)}
        icon="FLASK"
        tone={METRIC_TONE.NEUTRAL}
      />
      <MetricCard
        label={t.win}
        value={
          result.winRate === null
            ? EMPTY_VALUE
            : format.percentage.format(result.winRate)
        }
        icon="TARGET"
        detail={
          result.winRate !== null && (
            <MetricBar
              segments={[{ tone: METRIC_TONE.POSITIVE, ratio: result.winRate }]}
            />
          )
        }
      />
      <MetricCard
        label={t.result}
        value={
          result.totalR === null
            ? EMPTY_VALUE
            : `${format.money.format(result.totalR)} R`
        }
        icon="TREND"
        tone={numericTone(result.totalR ?? 0)}
      >
        <SeriesChart
          compact
          signed
          values={values}
          label={t.cumulative}
          unit=" R"
        />
      </MetricCard>
    </MetricGrid>
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
                <td className={numericTone(totalR ?? 0)}>{average(totalR)}</td>
                <td className={numericTone(mean ?? 0)}>{average(mean)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export function BacktestDetailsPage({ id }: { id: string }) {
  const b = useBacktestMessages();
  const run = useJournal((state) =>
    state.backtests.find((entry) => entry.id === id),
  );
  const book = useJournal((state) =>
    state.playbooks.find((entry) => entry.id === run?.playbook?.id),
  );
  const oldBook = useJournal((state) =>
    deletedPlaybook(state.trash, run?.playbook?.id),
  );
  const deleted = useTrashMessages().deleted;
  const trades = useJournal((state) => state.trades);
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
    ? (trades ?? []).filter(({ playbook }) => playbook?.id === attached.id)
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
              {book.title}
            </a>
          )}
          {!book && oldBook && attached && (
            <span>
              {oldBook.title} · {deleted}
            </span>
          )}
        </div>
        <div className="workspace-actions">
          <DeleteRecord
            kind={TRASH_KIND.BACKTEST}
            recordKey={id}
            revision={run.revision}
            afterDelete={() => {
              window.location.hash = PAGE_HASHES.backtests;
            }}
          />
          <IconAction
            icon={ICON_ACTION.EDIT}
            label={b.edit}
            href={backtestHref(id, true)}
          />
        </div>
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
            <a
              className="action-link secondary"
              href={backtestSampleHref(run.id)}
            >
              ＋ {b.addSample}
            </a>
          }
        >
          {run.samples.length ? (
            <BacktestSamplesTable run={run} />
          ) : (
            <p>{b.noSamples}</p>
          )}
        </Panel>
      </div>
    </main>
  );
}
