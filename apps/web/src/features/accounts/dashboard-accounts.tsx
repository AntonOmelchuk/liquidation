import { accountBalance } from "@liquidation/domain/accounts/performance";
import { PAGE_HASHES } from "../../app/constants.ts";
import { accountHref } from "../../app/page.ts";
import { useJournal } from "../journal/data/store.ts";
import { useLocale } from "../../shared/messages.ts";
import { useAccountMessages } from "./messages.ts";
import { useAccountSource } from "./use-account-source.ts";
import "./accounts.css";

export function DashboardAccounts() {
  const m = useAccountMessages();
  const { format } = useLocale();
  const accounts = useJournal((state) => state.accounts);
  const source = useAccountSource();
  const active = accounts.filter((account) => !account.archived);
  if (!active.length)
    return (
      <div className="dashboard-account-empty">
        <a className="record-link" href={PAGE_HASHES.accounts}>
          {m.createFirst} →
        </a>
      </div>
    );
  const now = new Date().toISOString();
  return (
    <section className="dashboard-accounts" aria-label={m.accounts}>
      {active.map((account) => (
        <article key={account.id} className="panel account-tile">
          <a className="record-link" href={accountHref(account.id)}>
            {account.name}
          </a>
          <strong className="account-tile-balance">
            <span className="visually-hidden">{m.balance} </span>
            {format.money.format(accountBalance(account, source, now))}{" "}
            {account.currency}
          </strong>
        </article>
      ))}
    </section>
  );
}
