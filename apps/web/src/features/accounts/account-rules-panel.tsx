import { EMPTY_VALUE } from "../../shared/constants.ts";
import { numericTone } from "../../shared/format.ts";
import { useLocale } from "../../shared/messages.ts";
import { Panel } from "../../shared/ui/layout.tsx";
import { MetricBar } from "../../shared/ui/metric-bar.tsx";
import { MetricCard, MetricGrid } from "../../shared/ui/metric-card.tsx";
import { METRIC_TONE } from "../../shared/ui/metric-constants.ts";
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
  const {
    dailyUsed,
    dailyLimit,
    target,
    targetRemaining,
    tradingDays,
    minimumDays,
  } = progress;
  const dailyTone =
    dailyLimit !== null && dailyUsed >= dailyLimit
      ? METRIC_TONE.NEGATIVE
      : METRIC_TONE.CAUTION;
  return (
    <Panel title={m.rules} detail={progress.firmDay + " · " + rules.timeZone}>
      <MetricGrid compact>
        {rules.dailyLimit && (
          <>
            <MetricCard
              label={m.dailyUsed}
              value={money(dailyUsed) + " / " + money(dailyLimit)}
              icon="ACTIVITY"
              tone={dailyUsed > 0 ? dailyTone : undefined}
              detail={
                dailyLimit && !progress.dailyIncomplete ? (
                  <MetricBar
                    segments={[
                      {
                        tone: dailyTone,
                        ratio: Math.min(1, dailyUsed / dailyLimit),
                      },
                    ]}
                  />
                ) : undefined
              }
            />
            <MetricCard
              label={m.dailyRemaining}
              value={money(progress.dailyRemaining)}
              icon="WARNING"
              tone={numericTone(progress.dailyRemaining ?? 0)}
              detail={progress.dailyIncomplete ? m.incomplete : undefined}
            />
          </>
        )}
        {rules.maxLoss && (
          <>
            <MetricCard
              label={m.maxLossRemaining}
              value={money(progress.remaining)}
              icon="DRAWDOWN"
              tone={numericTone(progress.remaining ?? 0)}
              detail={m[rules.maxLossMode]}
            />
            <MetricCard
              label={m.atStops}
              value={money(progress.remainingAtStops)}
              icon="WARNING"
              tone={numericTone(progress.remainingAtStops ?? 0)}
              detail={progress.maxLossIncomplete ? m.incomplete : undefined}
            />
          </>
        )}
        {rules.target && (
          <MetricCard
            label={m.targetRemaining}
            value={money(targetRemaining) + " / " + money(target)}
            icon="TARGET"
            tone={METRIC_TONE.NEUTRAL}
            detail={
              target && targetRemaining !== null ? (
                <MetricBar
                  segments={[
                    {
                      tone: METRIC_TONE.POSITIVE,
                      ratio: Math.max(0, 1 - targetRemaining / target),
                    },
                  ]}
                />
              ) : undefined
            }
          />
        )}
        <MetricCard
          label={m.tradingDays}
          value={
            format.integer.format(tradingDays) +
            (minimumDays ? " / " + format.integer.format(minimumDays) : "")
          }
          icon="CALENDAR"
          detail={
            minimumDays ? (
              <MetricBar
                segments={[
                  {
                    tone: METRIC_TONE.ACCENT,
                    ratio: Math.min(1, tradingDays / minimumDays),
                  },
                ]}
              />
            ) : undefined
          }
        />
      </MetricGrid>
      <p className="analytics-hint">{m.rulesHint}</p>
    </Panel>
  );
}
