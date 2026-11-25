import { EMPTY_VALUE } from "../../shared/constants.ts";
import { useLocale } from "../../shared/messages.ts";
import { TRADE_COLUMN } from "./constants.ts";
import { useStatisticsHelp } from "./help-messages.ts";
import { useStatisticsMessages } from "./messages.ts";

export function MetricGlossary() {
  const { t } = useLocale();
  const s = useStatisticsMessages();
  const { metrics } = useStatisticsHelp();
  const terms = [
    [t.count, TRADE_COLUMN.COUNT],
    [t.win, TRADE_COLUMN.WIN_RATE],
    [t.pnl, TRADE_COLUMN.NET],
    [t.profitFactor, TRADE_COLUMN.PROFIT_FACTOR],
    [s.avgRR, TRADE_COLUMN.PAYOFF],
    [s.expectancy, TRADE_COLUMN.EXPECTANCY],
    [t.result, TRADE_COLUMN.TOTAL_R],
    [s.openingShort, TRADE_COLUMN.OPENING],
    [s.balanceShort, TRADE_COLUMN.BALANCE],
  ] as const;
  return (
    <dl className="statistics-metric-glossary">
      {terms.map(([label, key]) => (
        <div key={key}>
          <dt>{label}</dt>
          <dd>{metrics[key]}</dd>
        </div>
      ))}
      <div>
        <dt>{EMPTY_VALUE}</dt>
        <dd>{s.unavailableMetric}</dd>
      </div>
    </dl>
  );
}
