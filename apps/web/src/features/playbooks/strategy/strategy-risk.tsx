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
import { useLocale } from "../../../shared/messages.ts";
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
  const metrics = [
    [s.trades, format.integer.format(estimate.trades)],
    [s.wins, format.integer.format(estimate.wins)],
    [s.losses, format.integer.format(estimate.losses)],
    [s.expectancy, format.money.format(estimate.expectancyR) + " R"],
    [s.returnRate, format.percentage.format(estimate.returnRate)],
    [s.finalCapital, format.money.format(estimate.capital)],
  ];
  return (
    <div>
      <h3>{s.riskForecast}</h3>
      <dl className="strategy-facts">
        {metrics.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
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
