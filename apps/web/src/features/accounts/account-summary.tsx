import { EMPTY_VALUE } from "../../shared/constants.ts";
import { numericTone } from "../../shared/format.ts";
import { useLocale } from "../../shared/messages.ts";
import { Metric } from "../../shared/ui/layout.tsx";
import { useAccountMessages } from "./messages.ts";
import type { AccountSummaryProps } from "./types.ts";

export function AccountSummary({
  account,
  performance,
  compact,
}: AccountSummaryProps) {
  const { t, format } = useLocale();
  const m = useAccountMessages();
  const money = (value: number) =>
    format.money.format(value) + " " + account.currency;
  const rate =
    performance.returnRate === null
      ? EMPTY_VALUE
      : format.percentage.format(performance.returnRate);
  if (compact)
    return (
      <div className="account-compact-summary">
        <strong>{money(performance.balance)}</strong>
        <small className={numericTone(performance.performance)}>
          {money(performance.performance)} · {rate}
        </small>
        <small>
          {m.startingBalance} · {money(account.startingBalance)}
        </small>
        <small>
          {m.openRisk} · {money(performance.openRisk)}
          {performance.riskUnknown > 0 &&
            " · " + m.unknownRisk + " " + performance.riskUnknown}
        </small>
      </div>
    );
  return (
    <>
      <section className="metrics account-metrics" aria-label={m.accounts}>
        <Metric label={m.balance} value={money(performance.balance)} />
        <Metric
          label={m.tradePnl}
          value={money(performance.stats.net)}
          detail={
            t.count + " · " + format.integer.format(performance.stats.count)
          }
        />
        <Metric label={m.performance} value={money(performance.performance)} />
        <Metric
          label={m.returnRate}
          value={rate}
          detail={m.funded + " · " + money(performance.funded)}
        />
        <Metric
          label={m.openRisk}
          value={money(performance.openRisk)}
          detail={
            m.positions +
            " · " +
            performance.positions +
            (performance.riskUnknown
              ? " · " + m.unknownRisk + " " + performance.riskUnknown
              : "")
          }
        />
      </section>
      <dl className="statistics-facts account-balance-facts">
        <div>
          <dt>{m.maxDrawdown}</dt>
          <dd>
            {money(performance.maxDrawdown)}
            {performance.maxDrawdownRate !== null &&
              " · " + format.percentage.format(performance.maxDrawdownRate)}
          </dd>
        </div>
        {[
          [m.startingBalance, account.startingBalance],
          [m.deposits, performance.deposits],
          [m.withdrawals, performance.withdrawals],
          [m.fees, performance.fees],
          [m.corrections, performance.corrections],
        ].map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{money(Number(value))}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
