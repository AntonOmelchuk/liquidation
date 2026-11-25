import { EMPTY_VALUE } from "../../shared/constants.ts";
import { numericTone } from "../../shared/format.ts";
import { useLocale } from "../../shared/messages.ts";
import { Panel } from "../../shared/ui/layout.tsx";
import { useAccountMessages } from "./messages.ts";
import type { AccountRulesPanelProps } from "./types.ts";

export function AccountRulesPanel({
  account,
  progress,
}: AccountRulesPanelProps) {
  const m = useAccountMessages();
  const { format } = useLocale();
  const money = (amount: number | null) =>
    amount === null
      ? EMPTY_VALUE
      : format.money.format(amount) + " " + account.currency;
  const rules = account.rules;
  if (!rules) return null;
  return (
    <Panel title={m.rules} detail={progress.firmDay + " · " + rules.timeZone}>
      <dl className="statistics-facts account-rule-progress">
        {rules.dailyLimit && (
          <>
            <div>
              <dt>{m.dailyUsed}</dt>
              <dd>
                {money(progress.dailyUsed)} / {money(progress.dailyLimit)}
              </dd>
            </div>
            <div>
              <dt>{m.dailyRemaining}</dt>
              <dd
                className={
                  progress.dailyRemaining !== null
                    ? numericTone(progress.dailyRemaining)
                    : undefined
                }
              >
                {money(progress.dailyRemaining)}
                {progress.dailyIncomplete && <small>{m.incomplete}</small>}
              </dd>
            </div>
          </>
        )}
        {rules.maxLoss && (
          <>
            <div>
              <dt>
                {m.maxLossRemaining} · {m[rules.maxLossMode]}
              </dt>
              <dd
                className={
                  progress.remaining !== null
                    ? numericTone(progress.remaining)
                    : undefined
                }
              >
                {money(progress.remaining)}
              </dd>
            </div>
            <div>
              <dt>{m.atStops}</dt>
              <dd
                className={
                  progress.remainingAtStops !== null
                    ? numericTone(progress.remainingAtStops)
                    : undefined
                }
              >
                {money(progress.remainingAtStops)}
                {progress.maxLossIncomplete && <small>{m.incomplete}</small>}
              </dd>
            </div>
          </>
        )}
        {rules.target && (
          <div>
            <dt>{m.targetRemaining}</dt>
            <dd>
              {money(progress.targetRemaining)} / {money(progress.target)}
            </dd>
          </div>
        )}
        <div>
          <dt>{m.tradingDays}</dt>
          <dd>
            {progress.tradingDays}
            {progress.minimumDays ? " / " + progress.minimumDays : ""}
          </dd>
        </div>
      </dl>
      <p className="analytics-hint">{m.rulesHint}</p>
    </Panel>
  );
}
