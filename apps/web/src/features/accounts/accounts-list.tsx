import { accountPerformance } from "@liquidation/domain/accounts/performance";
import { tradeTagKey } from "@liquidation/domain/trades/trade-tags";
import { accountHref } from "../../app/page.ts";
import { EMPTY_VALUE } from "../../shared/constants.ts";
import { numericTone } from "../../shared/format.ts";
import { useLocale } from "../../shared/messages.ts";
import { Panel } from "../../shared/ui/layout.tsx";
import { useJournal } from "../journal/data/store.ts";
import { useAccountMessages } from "./messages.ts";
import type { AccountsListProps } from "./types.ts";
import { useAccountSource } from "./use-account-source.ts";

export function AccountsList({ onCreate }: AccountsListProps) {
  const { t, format } = useLocale();
  const m = useAccountMessages();
  const accounts = useJournal((state) => state.accounts);
  const source = useAccountSource();
  const legacy = new Map<string, string>();
  for (const trade of [...source.trades, ...source.positions]) {
    if (!trade.accountId && trade.account)
      legacy.set(tradeTagKey(trade.account), trade.account);
  }
  const rows = accounts.toSorted(
    (a, b) =>
      Number(a.archived) - Number(b.archived) || a.name.localeCompare(b.name),
  );
  return (
    <div className="layout">
      <Panel title={m.accounts}>
        {rows.length ? (
          <div className="table compact-record-table">
            <table aria-label={m.accounts}>
              <thead>
                <tr>
                  <th>{m.name}</th>
                  <th>{m.kind}</th>
                  <th>{m.startingBalance}</th>
                  <th>{m.balance}</th>
                  <th>{m.tradePnl}</th>
                  <th>{m.returnRate}</th>
                  <th>{m.openRisk}</th>
                  <th>{t.count}</th>
                  <th>{m.positions}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((account) => {
                  const result = accountPerformance(account, source);
                  const money = (value: number) =>
                    format.money.format(value) + " " + account.currency;
                  return (
                    <tr key={account.id}>
                      <th scope="row">
                        <a
                          className="record-link"
                          href={accountHref(account.id)}
                        >
                          {account.name}
                        </a>
                        {account.archived && <small>{m.archived}</small>}
                        {account.firm && <small>{account.firm}</small>}
                      </th>
                      <td>{m[account.kind]}</td>
                      <td>{money(account.startingBalance)}</td>
                      <td>{money(result.balance)}</td>
                      <td className={numericTone(result.stats.net)}>
                        {money(result.stats.net)}
                      </td>
                      <td>
                        {result.returnRate === null
                          ? EMPTY_VALUE
                          : format.percentage.format(result.returnRate)}
                      </td>
                      <td>
                        {money(result.openRisk)}
                        {result.riskUnknown > 0 && (
                          <small>
                            {m.unknownRisk} · {result.riskUnknown}
                          </small>
                        )}
                      </td>
                      <td>{format.integer.format(result.stats.count)}</td>
                      <td>{result.positions}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p>{m.noAccounts}</p>
        )}
      </Panel>
      {legacy.size > 0 && (
        <Panel title={m.legacy}>
          <p>{m.adoptLegacy}</p>
          <div className="workspace-actions">
            {[...legacy.values()].map((name) => (
              <button
                className="secondary"
                key={name}
                type="button"
                onClick={() => onCreate(name)}
              >
                ＋ {name}
              </button>
            ))}
          </div>
        </Panel>
      )}
      <p className="analytics-hint">{m.currencyHint}</p>
    </div>
  );
}
