import { currentVersion } from "@liquidation/domain/playbooks/playbook";
import { getPlaybookTemplate } from "@liquidation/domain/playbooks/strategy";
import { TRASH_KIND } from "@liquidation/domain/journal/trash/constants";
import { DeleteRecord } from "../../trash/delete-record.tsx";
import {
  adherence,
  playbookResults,
} from "@liquidation/domain/playbooks/playbook-performance";
import { useEffect, useRef, useState } from "react";
import { PAGE_HASHES } from "../../../app/constants.ts";
import { playbookHref } from "../../../app/page.ts";
import { EMPTY_VALUE } from "../../../shared/constants.ts";
import { useLocale } from "../../../shared/messages.ts";
import { ScreenshotGallery } from "../../../shared/screenshots/screenshot-gallery.tsx";
import { Metric, Panel } from "../../../shared/ui/layout.tsx";
import { SelectField } from "../../../shared/ui/select-field.tsx";
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
  const [number, setNumber] = useState<number>();
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

  const latest = currentVersion(book);
  const version =
    book.versions.find((item) => item.number === number) ?? latest;
  const trades = (allTrades ?? []).filter(
    ({ playbook }) => playbook?.id === id,
  );
  const positions = allPositions.filter(({ playbook }) => playbook?.id === id);
  const results = playbookResults(trades);
  const entry = adherence(trades, "entry");
  const exit = adherence(trades, "management");
  const rate = (value: number | null) =>
    value === null ? EMPTY_VALUE : format.percentage.format(value);
  const limits = LIMIT_NAMES.filter((name) => book.limits[name] !== undefined);
  const setups = version.setups.map((setup) => (
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
            <span>v{latest.number}</span>
            <span>{s[getPlaybookTemplate(latest.strategy)]}</span>
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
          <a className="action-link" href={playbookHref(id, true)}>
            {b.edit}
          </a>
        </div>
      </div>
      <section className="metrics playbook-metrics" aria-label={b.checklists}>
        <Metric
          label={t.pnl}
          value={format.money.format(results.net)}
          detail={`${t.count} · ${format.integer.format(results.count)}`}
        />
        <Metric
          label={b.clean}
          value={rate(entry.rate)}
          detail={`${b.sample} · ${format.integer.format(entry.count)}`}
        />
        <Metric
          label={b.held}
          value={rate(exit.rate)}
          detail={`${b.sample} · ${format.integer.format(exit.count)}`}
        />
      </section>
      <div className="layout">
        {book.overview && (
          <Panel title={b.strategy}>
            <p className="record-prose">{book.overview}</p>
          </Panel>
        )}
        <Panel
          title={b.history}
          detail={
            <SelectField
              label={b.version}
              value={version.number}
              onChange={(event) => setNumber(Number(event.target.value))}
            >
              {book.versions.toReversed().map(({ number, at }) => (
                <option key={number} value={number}>
                  v{number} ·{" "}
                  {number === latest.number
                    ? b.currentVersion
                    : format.date.format(Date.parse(at))}
                </option>
              ))}
            </SelectField>
          }
        >
          {Boolean(version.screenshotIds?.length) && (
            <div className="playbook-overview-images">
              <h3>{b.images}</h3>
              <ScreenshotGallery ids={version.screenshotIds} />
            </div>
          )}
          {!version.strategy && (
            <div className="playbook-rule-columns">
              <div>
                <h3>{b.setups}</h3>
                {setups}
              </div>
              <div>
                <h3>{b.filters}</h3>
                <RulesList rules={version.filters} />
              </div>
              <div>
                <h3>{b.management}</h3>
                <RulesList rules={version.management} />
              </div>
            </div>
          )}
        </Panel>
        {version.strategy && (
          <StrategyDetails
            strategy={version.strategy}
            setups={
              <div>
                <h3>{b.setups}</h3>
                {setups}
              </div>
            }
            technical={<RulesList rules={version.filters} />}
            management={<RulesList rules={version.management} />}
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
        <RuleResults book={book} version={version} trades={trades} />
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
