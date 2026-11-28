import { ICON_ACTION } from "../../../shared/ui/constants.ts";
import { IconAction } from "../../../shared/ui/icon-action.tsx";
import { tradeCurves } from "@liquidation/domain/analytics/trade-risk";
import { playbookRulesScreenshotIds } from "@liquidation/domain/playbooks/playbook";
import { getPlaybookTemplate } from "@liquidation/domain/playbooks/strategy";
import { TRASH_KIND } from "@liquidation/domain/journal/trash/constants";
import { DeleteRecord } from "../../trash/delete-record.tsx";
import {
  adherence,
  playbookResults,
} from "@liquidation/domain/playbooks/playbook-performance";
import { useEffect, useRef } from "react";
import { PAGE_HASHES } from "../../../app/constants.ts";
import { playbookHref } from "../../../app/page.ts";
import { SeriesChart } from "../../../shared/analytics/series-chart.tsx";
import { EMPTY_VALUE } from "../../../shared/constants.ts";
import { numericTone } from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import { ScreenshotGallery } from "../../../shared/screenshots/screenshot-gallery.tsx";
import { Panel } from "../../../shared/ui/layout.tsx";
import { MetricBar } from "../../../shared/ui/metric-bar.tsx";
import { MetricCard, MetricGrid } from "../../../shared/ui/metric-card.tsx";
import { METRIC_TONE } from "../../../shared/ui/metric-constants.ts";
import { useJournal } from "../../journal/data/store.ts";
import { JournalUnavailable } from "../../journal/journal-unavailable.tsx";
import { TradeTable } from "../../journal/records/trade-table.tsx";
import { LIMIT_NAMES } from "../limits.ts";
import { usePlaybookMessages } from "../messages.ts";
import { useStrategyMessages } from "../strategy/messages.ts";
import { StrategyDetails } from "../strategy/strategy-details.tsx";
import { RuleResults, SetupResults } from "./playbook-results.tsx";
import { PlaybookReviews } from "./playbook-reviews.tsx";
import type { RulesListProps } from "./types.ts";

function RulesList({ rules }: RulesListProps) {
  const b = usePlaybookMessages();
  if (!rules.length) return <p>{b.noRules}</p>;
  return (
    <ul className="playbook-rule-list">
      {rules.map(({ id, label, detail }) => (
        <li key={id}>
          <strong>{label}</strong>
          {detail && <p>{detail}</p>}
        </li>
      ))}
    </ul>
  );
}

export default function PlaybookDetailsPage({ id }: { id: string }) {
  const b = usePlaybookMessages();
  const s = useStrategyMessages();
  const { t, format } = useLocale();
  const book = useJournal((state) =>
    state.playbooks.find((item) => item.id === id),
  );
  const allTrades = useJournal((state) => state.trades);
  const allPositions = useJournal((state) => state.positions);
  const heading = useRef<HTMLHeadingElement>(null);
  const loaded = Boolean(book);

  useEffect(() => {
    if (loaded) {
      window.scrollTo(0, 0);
      heading.current?.focus({ preventScroll: true });
    }
  }, [loaded]);

  if (!book) {
    return (
      <JournalUnavailable
        backHref={PAGE_HASHES.playbooks}
        backLabel={b.back}
        missing={b.missing}
      />
    );
  }

  const { rules } = book;
  const activeImages = new Set(playbookRulesScreenshotIds(rules));
  const legacyImages = [
    ...new Set(book.legacyVersions?.flatMap(playbookRulesScreenshotIds)),
  ].filter((id) => !activeImages.has(id));
  const trades = (allTrades ?? []).filter(
    ({ playbook }) => playbook?.id === id,
  );
  const positions = allPositions.filter(({ playbook }) => playbook?.id === id);
  const results = playbookResults(trades);
  const { cash } = tradeCurves(trades);
  const entry = adherence(trades, "entry");
  const exit = adherence(trades, "management");
  const rate = (value: number | null) =>
    value === null ? EMPTY_VALUE : format.percentage.format(value);
  const limits = LIMIT_NAMES.filter((name) => book.limits[name] !== undefined);
  const setups = rules.setups.map((setup) => (
    <section className="setup-editor" key={setup.id}>
      <h4>{setup.name || b.onlySetup}</h4>
      {setup.description && <p className="record-prose">{setup.description}</p>}
      {Boolean(setup.screenshotIds?.length) && (
        <div>
          <h4>{b.setupImages}</h4>
          <ScreenshotGallery ids={setup.screenshotIds} />
        </div>
      )}
      <RulesList rules={setup.rules} />
    </section>
  ));

  return (
    <main className="playbook-detail-page">
      <a href={PAGE_HASHES.playbooks} className="record-back">
        ← {b.back}
      </a>
      <div className="page-heading plan-detail-heading">
        <div>
          <h1 ref={heading} tabIndex={-1}>
            {book.title}
          </h1>
          <div className="plan-detail-meta">
            <span className="playbook-status" data-status={book.status}>
              {b[book.status]}
            </span>
            <span>{s[getPlaybookTemplate(rules.strategy)]}</span>
          </div>
        </div>
        <div className="workspace-actions">
          <DeleteRecord
            kind={TRASH_KIND.PLAYBOOK}
            recordKey={id}
            revision={book.revision}
            afterDelete={() => {
              window.location.hash = PAGE_HASHES.playbooks;
            }}
          />
          <IconAction
            icon={ICON_ACTION.EDIT}
            label={b.edit}
            href={playbookHref(id, true)}
          />
        </div>
      </div>
      <MetricGrid label={b.checklists}>
        <MetricCard
          label={t.pnl}
          value={format.money.format(results.net)}
          icon="TREND"
          tone={numericTone(results.net)}
          featured
          detail={`${t.count} · ${format.integer.format(results.count)}`}
        >
          <SeriesChart
            compact
            signed
            values={cash.length ? [0, ...cash.map(({ value }) => value)] : []}
            label={t.cumulative}
          />
        </MetricCard>
        <MetricCard
          label={b.clean}
          value={rate(entry.rate)}
          icon="CHECKLIST"
          detail={
            <>
              <span>
                {b.sample} · {format.integer.format(entry.count)}
              </span>
              {entry.rate !== null && (
                <MetricBar
                  segments={[{ tone: METRIC_TONE.POSITIVE, ratio: entry.rate }]}
                />
              )}
            </>
          }
        />
        <MetricCard
          label={b.held}
          value={rate(exit.rate)}
          icon="TARGET"
          tone={METRIC_TONE.NEUTRAL}
          detail={
            <>
              <span>
                {b.sample} · {format.integer.format(exit.count)}
              </span>
              {exit.rate !== null && (
                <MetricBar
                  segments={[{ tone: METRIC_TONE.NEUTRAL, ratio: exit.rate }]}
                />
              )}
            </>
          }
        />
      </MetricGrid>
      <div className="layout">
        {book.overview && (
          <Panel title={b.strategy}>
            <p className="record-prose">{book.overview}</p>
          </Panel>
        )}
        <Panel title={b.rules}>
          {Boolean(rules.screenshotIds?.length) && (
            <div className="playbook-overview-images">
              <h3>{b.images}</h3>
              <ScreenshotGallery ids={rules.screenshotIds} />
            </div>
          )}
          {legacyImages.length > 0 && (
            <details className="playbook-overview-images">
              <summary>{b.savedImages}</summary>
              <ScreenshotGallery ids={legacyImages} />
            </details>
          )}
          {!rules.strategy && (
            <div className="playbook-rule-columns">
              <div>
                <h3>{b.setups}</h3>
                {setups}
              </div>
              <div>
                <h3>{b.filters}</h3>
                <RulesList rules={rules.filters} />
              </div>
              <div>
                <h3>{b.management}</h3>
                <RulesList rules={rules.management} />
              </div>
            </div>
          )}
        </Panel>
        {rules.strategy && (
          <StrategyDetails
            strategy={rules.strategy}
            setups={
              <div>
                <h3>{b.setups}</h3>
                {setups}
              </div>
            }
            technical={<RulesList rules={rules.filters} />}
            management={<RulesList rules={rules.management} />}
          />
        )}
        {limits.length > 0 && (
          <Panel title={b.limits}>
            <dl className="playbook-facts">
              {limits.map((name) => (
                <div key={name}>
                  <dt>{b[name]}</dt>
                  <dd>{format.price.format(book.limits[name]!)}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        )}
        {book.notes && (
          <Panel title={t.notes}>
            <p className="record-prose">{book.notes}</p>
          </Panel>
        )}
        <SetupResults book={book} trades={trades} />
        <RuleResults book={book} trades={trades} />
        <Panel
          title={b.linked}
          detail={`${b.linkedOpen} · ${positions.length}`}
        >
          <TradeTable trades={trades} />
          {positions.length > 0 && (
            <ul className="playbook-rule-list">
              {positions.map((position) => (
                <li key={position.id}>
                  {position.symbol} · {t[position.direction]} ·{" "}
                  {format.date.format(Date.parse(position.openedAt))}
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <PlaybookReviews book={book} count={trades.length} />
      </div>
    </main>
  );
}
