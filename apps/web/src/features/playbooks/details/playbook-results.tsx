import { tradePlaybookRules } from "@liquidation/domain/playbooks/playbook";
import type { Trade } from "@liquidation/domain/trades/types";
import type { SetupResultsProps } from "./types.ts";

import {
  playbookResults,
  ruleOutcomes,
} from "@liquidation/domain/playbooks/playbook-performance";

import { tradeLinksHref } from "../../../app/page.ts";
import { EMPTY_VALUE } from "../../../shared/constants.ts";
import { numericTone } from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import { Panel } from "../../../shared/ui/layout.tsx";
import { usePlaybookMessages } from "../messages.ts";

export function SetupResults({ book, trades }: SetupResultsProps) {
  const b = usePlaybookMessages();
  const { t, format } = useLocale();
  const names = new Map(
    book.rules.setups.map(({ id, name }) => [id, name] as const),
  );
  const groups = new Map<string | undefined, Trade[]>();
  for (const trade of trades) {
    const link = trade.playbook;
    const id = link?.setupId;
    if (link && id && !names.has(id))
      names.set(id, tradePlaybookRules(book, link)?.setupName ?? "");
    const group = groups.get(id) ?? [];
    group.push(trade);
    groups.set(id, group);
  }

  return (
    <Panel title={b.bySetup}>
      {groups.size === 0 ? (
        <p>{t.noTrades}</p>
      ) : (
        <div className="table">
          <table>
            <thead>
              <tr>
                <th scope="col">{b.setup}</th>
                <th scope="col">{t.count}</th>
                <th scope="col">{t.win}</th>
                <th scope="col">{t.pnl}</th>
                <th scope="col">{t.result}</th>
              </tr>
            </thead>
            <tbody>
              {[...groups].map(([id, group]) => {
                const outcome = playbookResults(group);
                return (
                  <tr key={id ?? "unclassified"}>
                    <th scope="row">
                      {id ? names.get(id) || b.onlySetup : b.noSetup}
                    </th>
                    <td>{format.integer.format(outcome.count)}</td>
                    <td>
                      {outcome.winRate === null
                        ? EMPTY_VALUE
                        : format.percentage.format(outcome.winRate)}
                    </td>
                    <td className={numericTone(outcome.net)}>
                      {format.money.format(outcome.net)}
                    </td>
                    <td>
                      {outcome.totalR === null
                        ? EMPTY_VALUE
                        : format.money.format(outcome.totalR)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

export function RuleResults({ book, trades }: SetupResultsProps) {
  const b = usePlaybookMessages();
  const { t, format } = useLocale();
  const data = ruleOutcomes(book, trades);
  const r = (value: number | null) =>
    value === null ? EMPTY_VALUE : format.money.format(value);
  return (
    <Panel
      title={b.rulesImpact}
      detail={`${b.sample} ${format.integer.format(data.assessed)}`}
    >
      {data.assessed > 0 ? (
        <div className="table">
          <table>
            <thead>
              <tr>
                <th scope="col">{b.rule}</th>
                <th scope="col">{t.count}</th>
                <th scope="col">{t.result}</th>
                <th scope="col">{b.missingRisk}</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map(({ rule, misses, results }) => (
                <tr key={rule.id}>
                  <th scope="row">
                    <details className="rule-reasons">
                      <summary>{rule.label}</summary>
                      <ul>
                        {misses.map(({ trade, reason }) => (
                          <li key={trade.id}>
                            <a
                              className="record-link"
                              href={tradeLinksHref(trade.id)}
                            >
                              {trade.symbol} ·{" "}
                              {format.date.format(Date.parse(trade.openedAt))}
                            </a>
                            {reason && <p>{reason}</p>}
                          </li>
                        ))}
                      </ul>
                    </details>
                  </th>
                  <td>{format.integer.format(results.count)}</td>
                  <td>{r(results.totalR)}</td>
                  <td>{format.integer.format(results.riskMissing)}</td>
                </tr>
              ))}
              <tr>
                <th scope="row">{b.allKept}</th>
                <td>{format.integer.format(data.allKept.count)}</td>
                <td>{r(data.allKept.totalR)}</td>
                <td>{format.integer.format(data.allKept.riskMissing)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <p>{b.noAssessments}</p>
      )}
    </Panel>
  );
}
