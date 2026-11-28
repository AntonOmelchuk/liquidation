import {
  STRATEGY_LIMITS,
  STRATEGY_RISK_INPUTS,
  TRADE_FREQUENCIES,
} from "@liquidation/domain/playbooks/constants";
import {
  forecastStrategy,
  strategyRiskSchema,
} from "@liquidation/domain/playbooks/strategy";
import type { StrategyRiskInputs } from "@liquidation/domain/playbooks/types";
import { numericTone } from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import { MetricCard, MetricGrid } from "../../../shared/ui/metric-card.tsx";
import { METRIC_TONE } from "../../../shared/ui/metric-constants.ts";
import { metricParts } from "../../../shared/ui/metric-parts.ts";
import {
  MetricGauge,
  MetricLegend,
} from "../../../shared/ui/metric-visuals.tsx";
import { SelectField } from "../../../shared/ui/select-field.tsx";
import { useStrategyMessages } from "./messages.ts";
import { RR_LIMIT } from "./constants.ts";
import type { StrategyRiskProps } from "./types.ts";

export function StrategyForecast({ risk }: { risk: StrategyRiskInputs }) {
  const s = useStrategyMessages();
  const { format } = useLocale();
  const parsed = strategyRiskSchema.safeParse(risk);
  if (!parsed.success)
    return (
      <p className="error" role="status">
        {s.invalidForecast}
      </p>
    );
  const estimate = forecastStrategy(parsed.data);
  const outcomes = metricParts(format.integer, [
    [METRIC_TONE.POSITIVE, s.wins, estimate.wins],
    [METRIC_TONE.NEGATIVE, s.losses, estimate.losses],
  ]);
  return (
    <div>
      <h3>{s.riskForecast}</h3>
      <MetricGrid compact>
        <MetricCard
          label={s.trades}
          value={format.integer.format(estimate.trades)}
          icon="LAYERS"
          detail={<MetricLegend parts={outcomes} names />}
        >
          <MetricGauge parts={outcomes} semicircle />
        </MetricCard>
        <MetricCard
          label={s.expectancy}
          value={format.money.format(estimate.expectancyR) + " R"}
          icon="ACTIVITY"
          tone={numericTone(estimate.expectancyR)}
        />
        <MetricCard
          label={s.returnRate}
          value={format.percentage.format(estimate.returnRate)}
          icon="TREND"
          tone={numericTone(estimate.returnRate)}
        />
        <MetricCard
          label={s.finalCapital}
          value={format.money.format(estimate.capital)}
          icon="WALLET"
          tone={METRIC_TONE.NEUTRAL}
        />
      </MetricGrid>
      <p className="subdued">{s.riskHint}</p>
    </div>
  );
}

export function StrategyRisk({
  risk,
  limits,
  onRisk,
  onLimits,
}: StrategyRiskProps) {
  const s = useStrategyMessages();
  return (
    <div className="layout">
      <div>
        <h3>{s.startingInputs}</h3>
        <div className="record-field-grid">
          {(
            Object.keys(
              STRATEGY_RISK_INPUTS,
            ) as (keyof typeof STRATEGY_RISK_INPUTS)[]
          ).map((key) => (
            <label key={key}>
              {s[key]}
              <input
                type="number"
                required
                {...STRATEGY_RISK_INPUTS[key]}
                value={Number.isNaN(risk[key]) ? "" : risk[key]}
                onChange={(event) =>
                  onRisk({ ...risk, [key]: event.target.valueAsNumber })
                }
              />
            </label>
          ))}
          <SelectField
            label={s.frequency}
            value={risk.frequency}
            onChange={(event) => {
              const frequency = TRADE_FREQUENCIES.find(
                (value) => value === event.target.value,
              );
              if (frequency) onRisk({ ...risk, frequency });
            }}
          >
            {TRADE_FREQUENCIES.map((value) => (
              <option key={value} value={value}>
                {s[value]}
              </option>
            ))}
          </SelectField>
        </div>
      </div>
      <StrategyForecast risk={risk} />
      <div>
        <h3>{s.limits}</h3>
        <div className="record-field-grid">
          {STRATEGY_LIMITS.map((key) => (
            <label key={key}>
              {s[key]}
              {key === RR_LIMIT ? (
                <input
                  value={limits[key] ?? ""}
                  maxLength={40}
                  onChange={(event) =>
                    onLimits({
                      ...limits,
                      [key]: event.target.value || undefined,
                    })
                  }
                />
              ) : (
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="any"
                  value={limits[key] ?? ""}
                  onChange={(event) =>
                    onLimits({
                      ...limits,
                      [key]: event.target.value
                        ? event.target.valueAsNumber
                        : undefined,
                    })
                  }
                />
              )}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
