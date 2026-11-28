import { ICON_ACTION } from "../../shared/ui/constants.ts";
import { IconAction } from "../../shared/ui/icon-action.tsx";
import { ACCOUNT_RECORD } from "@liquidation/domain/accounts/constants";
import {
  accountPerformance,
  accountRuleProgress,
} from "@liquidation/domain/accounts/performance";
import { TRASH_KIND } from "@liquidation/domain/journal/trash/constants";
import { useState } from "react";
import { PAGE_HASHES } from "../../app/constants.ts";
import { statisticsHref } from "../../app/page.ts";
import { SeriesChart } from "../../shared/analytics/series-chart.tsx";
import { useLocale } from "../../shared/messages.ts";
import { Panel } from "../../shared/ui/layout.tsx";
import { useJournal } from "../journal/data/store.ts";
import { TradeTable } from "../journal/records/trade-table.tsx";
import { DeleteRecord } from "../trash/delete-record.tsx";
import { AccountEditor } from "./account-editor.tsx";
import { AccountMovements } from "./account-movements.tsx";
import { AccountRulesPanel } from "./account-rules-panel.tsx";
import { AccountSummary } from "./account-summary.tsx";
import { useAccountMessages } from "./messages.ts";
import type { AccountDetailsProps } from "./types.ts";
import { useAccountSave } from "./use-account-save.ts";
import { useAccountSource } from "./use-account-source.ts";

export function AccountDetails({ account }: AccountDetailsProps) {
  const m = useAccountMessages();
  const { t } = useLocale();
  const source = useAccountSource();
  const trash = useJournal((state) => state.trash);
  const [editing, setEditing] = useState(false);
  const { save, error, saving } = useAccountSave();
  const result = accountPerformance(account, source);
  const rules = accountRuleProgress(account, source, undefined, result);
  const trades = source.trades.filter(
    (trade) => trade.accountId === account.id,
  );
  const hasHistory =
    trades.length > 0 ||
    source.positions.some((position) => position.accountId === account.id) ||
    source.movements.some((movement) => movement.accountId === account.id) ||
    trash.some(
      (entry) =>
        (entry.kind === TRASH_KIND.TRADE ||
          entry.kind === TRASH_KIND.POSITION ||
          entry.kind === TRASH_KIND.MOVEMENT) &&
        entry.value.accountId === account.id,
    );
  return (
    <main className="account-details">
      <a className="record-back" href={PAGE_HASHES.accounts}>
        ← {m.accounts}
      </a>
      <header className="page-heading">
        <div>
          <h1>{account.name}</h1>
          <p className="subdued">
            {m[account.kind]} · {account.currency}
            {account.firm && " · " + account.firm}
            {account.archived && " · " + m.archived}
          </p>
        </div>
        <div className="workspace-actions">
          <a
            className="action-link secondary"
            href={statisticsHref(account.id)}
          >
            {t.statistics}
          </a>
          <IconAction
            icon={ICON_ACTION.EDIT}
            label={m.editAccount}
            disabled={editing || saving}
            onClick={() => setEditing(true)}
          />
          <button
            type="button"
            className="secondary"
            disabled={editing || saving}
            onClick={() =>
              void save({
                record: ACCOUNT_RECORD.ACCOUNT,
                id: account.id,
                revision: account.revision,
                input: { ...account, archived: !account.archived },
              })
            }
          >
            {account.archived ? m.unarchive : m.archive}
          </button>
          {!hasHistory && (
            <DeleteRecord
              kind={TRASH_KIND.ACCOUNT}
              recordKey={account.id}
              revision={account.revision}
              disabled={editing || saving}
              afterDelete={() => {
                window.location.hash = PAGE_HASHES.accounts;
              }}
            />
          )}
        </div>
      </header>
      <div className="layout">
        {error && (
          <p className="error" role="alert">
            {m[error]}
          </p>
        )}
        {editing && (
          <AccountEditor account={account} onClose={() => setEditing(false)} />
        )}
        <Panel title={m.balance}>
          <AccountSummary account={account} performance={result} />
          {account.notes && <p className="record-prose">{account.notes}</p>}
          {hasHistory && <p className="analytics-hint">{m.hasHistory}</p>}
        </Panel>
        {rules && <AccountRulesPanel account={account} progress={rules} />}
        <Panel title={m.balanceHistory}>
          <SeriesChart
            values={
              result.points.length
                ? [
                    account.startingBalance,
                    ...result.points.map((point) => point.balance),
                  ]
                : []
            }
            label={m.balanceHistory}
            unit={" " + account.currency}
            empty={m.noHistory}
          />
        </Panel>
        <AccountMovements account={account} />
        <Panel title={m.accountTrades} detail={trades.length}>
          <TradeTable trades={trades} />
        </Panel>
      </div>
    </main>
  );
}
