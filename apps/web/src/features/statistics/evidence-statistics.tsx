import {
  GroupCheckbox,
  GroupCheckboxHeader,
  GroupSelectionSummary,
  useTradeGroupSelection,
} from "./group-selection.tsx";
import { summarizePrices } from "@liquidation/domain/analytics/trade-risk";
import { tradeStatistics } from "@liquidation/domain/analytics/trade-statistics";
import { ruleOutcomes } from "@liquidation/domain/playbooks/playbook-performance";
import { EMPTY_VALUE } from "../../shared/constants.ts";
import { numericTone } from "../../shared/format.ts";
import { useLocale } from "../../shared/messages.ts";
import { Panel } from "../../shared/ui/layout.tsx";
import { useAllKnownPlaybooks } from "../journal/data/references.ts";
import { useAdvancedStatisticsMessages } from "./advanced-messages.ts";
import { BE_GROUP, PRICE_METRIC_KEYS } from "./advanced-constants.ts";
import type { TradeAnalysisProps } from "./types.ts";

export function EvidenceStatistics({ trades }: TradeAnalysisProps) {
  const { t, format } = useLocale();
  const a = useAdvancedStatisticsMessages();
  const books = useAllKnownPlaybooks();
  const prices = summarizePrices(trades);
  const money = (value: number | null) =>
    value === null ? EMPTY_VALUE : format.money.format(value);
  const be = [
    { key: BE_GROUP.MOVED, records: trades.filter((trade) => trade.breakeven) },
    {
      key: BE_GROUP.NOT_MOVED,
      records: trades.filter((trade) => !trade.breakeven),
    },
  ].map((group) => ({
    ...group,
    name: a[group.key],
    metrics: tradeStatistics(group.records),
  }));
  const beSelection = useTradeGroupSelection(be);
  const assessed = trades.filter(
    (trade) =>
      trade.playbook?.entry?.length || trade.playbook?.management?.length,
  );
  const clean = assessed.filter((trade) =>
    [
      ...(trade.playbook?.entry ?? []),
      ...(trade.playbook?.management ?? []),
    ].every((rule) => rule.met),
  );
  const exceptions = books
    .flatMap((book) =>
      ruleOutcomes(book, trades).rows.map((row) => ({
        key: book.id + ":" + row.rule.id,
        book: book.title,
        ...row,
        records: row.misses.map(({ trade }) => trade),
      })),
    )
    .sort((left, right) => left.results.net - right.results.net);
  const ruleSelection = useTradeGroupSelection(exceptions);
  return (
    <>
      <div className="analysis-chart-grid">
        <Panel title={a.prices}>
          <div className="table compact-record-table">
            <table aria-label={a.prices}>
              <thead>
                <tr>
                  <th>{a.prices}</th>
                  <th>R</th>
                  <th>{a.priceSample}</th>
                </tr>
              </thead>
              <tbody>
                {PRICE_METRIC_KEYS.map((key) => (
                  <tr key={key}>
                    <th scope="row">{a[key]}</th>
                    <td>{money(prices[key].average)}</td>
                    <td>{prices[key].count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {PRICE_METRIC_KEYS.every((key) => !prices[key].count) && (
            <p>{a.noPrice}</p>
          )}
        </Panel>
        <Panel title={a.breakeven}>
          <div className="table compact-record-table">
            <table aria-label={a.breakeven}>
              <thead>
                <tr>
                  <GroupCheckboxHeader selection={beSelection} />
                  <th>{a.group}</th>
                  <th>{t.count}</th>
                  <th>WR</th>
                  <th>{t.pnl}</th>
                  <th>Σ R</th>
                </tr>
              </thead>
              <tbody>
                {be.map(({ key, name, metrics }) => (
                  <tr key={key}>
                    <GroupCheckbox
                      selection={beSelection}
                      groupKey={key}
                      label={name}
                    />
                    <th scope="row">{name}</th>
                    <td>{metrics.count}</td>
                    <td>
                      {metrics.winRate === null
                        ? EMPTY_VALUE
                        : format.percentage.format(metrics.winRate)}
                    </td>
                    <td className={numericTone(metrics.net)}>
                      {money(metrics.net)}
                    </td>
                    <td>{money(metrics.totalR)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <GroupSelectionSummary selection={beSelection} />
        </Panel>
      </div>
      <Panel
        title={a.ruleDiscipline}
        detail={a.assessed + " · " + assessed.length}
      >
        <p>
          {a.clean} · {clean.length}/{assessed.length}
          {assessed.length > 0 &&
            " · " + format.percentage.format(clean.length / assessed.length)}
        </p>
        {exceptions.length > 0 && (
          <div className="table compact-record-table">
            <table aria-label={a.exceptions}>
              <thead>
                <tr>
                  <GroupCheckboxHeader selection={ruleSelection} />
                  <th>{a.rule}</th>
                  <th>{t.count}</th>
                  <th>{a.netOutcome}</th>
                  <th>Σ R</th>
                </tr>
              </thead>
              <tbody>
                {exceptions.map((row) => (
                  <tr key={row.key}>
                    <GroupCheckbox
                      selection={ruleSelection}
                      groupKey={row.key}
                      label={row.rule.label}
                    />
                    <th scope="row">
                      {row.rule.label}
                      <small>{row.book}</small>
                    </th>
                    <td>{row.results.count}</td>
                    <td className={numericTone(row.results.net)}>
                      {money(row.results.net)}
                    </td>
                    <td>{money(row.results.totalR)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <GroupSelectionSummary selection={ruleSelection} />
      </Panel>
    </>
  );
}
