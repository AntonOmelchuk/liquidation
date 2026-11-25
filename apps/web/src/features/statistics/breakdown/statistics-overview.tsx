import { TRADE_FACTOR } from "@liquidation/domain/analytics/constants";
import { useId } from "react";
import { InfoTip } from "../../../shared/ui/info-tip.tsx";
import { KNOWN_FACTOR_KEYS, OVERVIEW_SECTIONS } from "../constants.ts";
import { useStatisticsHelp } from "../help-messages.ts";
import { useStatisticsMessages } from "../messages.ts";
import { TradeBreakdownTable } from "./trade-breakdown.tsx";
import type { StatisticsOverviewProps } from "./types.ts";

export function StatisticsOverview({
  trades,
  totals,
  filters,
  balances,
  labelFor,
  selected,
  onSelect,
}: StatisticsOverviewProps) {
  const s = useStatisticsMessages();
  const { factors: help } = useStatisticsHelp();
  const id = useId();
  return (
    <div className="statistics-overview">
      {Object.entries(OVERVIEW_SECTIONS).map(([section, factors]) => (
        <section
          key={section}
          className="statistics-overview-section"
          aria-labelledby={id + section}
        >
          <h2 id={id + section} className="statistics-section-heading">
            {s[section as keyof typeof OVERVIEW_SECTIONS]}
          </h2>
          <div className="statistics-overview-columns">
            {factors.map((factor) => {
              const account = factor === TRADE_FACTOR.ACCOUNT;
              const active = filters[factor];
              const known = account
                ? [...balances.keys()]
                : (KNOWN_FACTOR_KEYS[factor] ?? []);
              const keys =
                active === undefined
                  ? known
                  : known.filter((key) => key === active);
              const expanded = selected?.factor === factor;
              const title = s.overviewTitles[factor];
              return (
                <section
                  className="panel statistics-overview-card"
                  key={factor}
                  data-wide={account || expanded || undefined}
                >
                  <div className="panel-heading">
                    <h2>{title}</h2>
                    <InfoTip label={title} text={help[factor]} />
                  </div>
                  <TradeBreakdownTable
                    factor={factor}
                    trades={trades}
                    totals={totals}
                    labelFor={labelFor}
                    compact
                    knownKeys={keys}
                    balances={account ? balances : undefined}
                    selected={expanded ? selected.key : null}
                    onSelect={(key) =>
                      onSelect(key === null ? null : { factor, key })
                    }
                  />
                </section>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
