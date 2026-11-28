import { tradeStatistics } from "@liquidation/domain/analytics/trade-statistics";
import { adherence } from "@liquidation/domain/playbooks/playbook-performance";
import { useMemo } from "react";
import { EMPTY_VALUE } from "../../../shared/constants.ts";
import { numericTone } from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import { MetricBar } from "../../../shared/ui/metric-bar.tsx";
import type { MetricBarProps } from "../../../shared/ui/types.ts";
import { useTradeMetricMessages } from "../../../shared/analytics/trade-metric-messages.ts";
import { useWorkspaceMessages } from "../messages.ts";
import { ENTRY_CHECKLIST } from "./constants.ts";
import type { ComparisonProps, ComparisonRow } from "./types.ts";
import "./comparison-table.css";

const periods = [0, 1] as const;

export function ComparisonTable({
  current,
  previous,
  currentLabel,
  previousLabel,
  showChange,
}: ComparisonProps) {
  const { t, format } = useLocale();
  const m = useWorkspaceMessages();
  const outcomes = useTradeMetricMessages();
  const now = useMemo(() => tradeStatistics(current), [current]);
  const before = useMemo(() => tradeStatistics(previous), [previous]);
  const currentEntry = useMemo(
    () => adherence(current, ENTRY_CHECKLIST),
    [current],
  );
  const previousEntry = useMemo(
    () => adherence(previous, ENTRY_CHECKLIST),
    [previous],
  );
  function outcomesBar(stats: typeof now): MetricBarProps {
    const count = stats.count || 1;
    return {
      label: [
        `${outcomes.wins} · ${format.integer.format(stats.wins)}`,
        `${outcomes.flat} · ${format.integer.format(stats.flat)}`,
        `${outcomes.losses} · ${format.integer.format(stats.losses)}`,
      ].join(", "),
      segments: [
        { tone: "positive", ratio: stats.wins / count },
        { tone: "neutral", ratio: stats.flat / count },
        { tone: "negative", ratio: stats.losses / count },
      ],
    };
  }
  const adherenceBar = (rate: number | null): MetricBarProps => ({
    segments: [{ tone: "positive", ratio: rate ?? 0 }],
  });

  const rows: ComparisonRow[] = [
    {
      label: t.count,
      values: [now.count, before.count],
      formatter: format.integer,
    },
    {
      label: t.pnl,
      values: [now.count ? now.net : null, before.count ? before.net : null],
      formatter: format.money,
      baseline: 0,
      signed: true,
    },
    {
      label: t.win,
      values: [now.winRate, before.winRate],
      formatter: format.percentage,
      bars: [outcomesBar(now), outcomesBar(before)],
    },
    {
      label: t.profitFactor,
      values: [now.profitFactor, before.profitFactor],
      formatter: format.money,
      baseline: 1,
    },
    {
      label: m.expectancy,
      values: [now.expectancy, before.expectancy],
      formatter: format.money,
      baseline: 0,
      signed: true,
    },
    {
      label: m.averageR,
      values: [now.expectancyR, before.expectancyR],
      formatter: format.money,
      baseline: 0,
      signed: true,
    },
    {
      label: m.riskCount,
      values: [now.countWithRisk, before.countWithRisk],
      formatter: format.integer,
    },
    {
      label: m.maxDrawdown,
      values: [
        now.count ? now.maxDrawdown : null,
        before.count ? before.maxDrawdown : null,
      ],
      formatter: format.money,
      baseline: 0,
      lowerIsBetter: true,
    },
    {
      label: m.adherence,
      values: [currentEntry.rate, previousEntry.rate],
      formatter: format.percentage,
      bars: [adherenceBar(currentEntry.rate), adherenceBar(previousEntry.rate)],
    },
    {
      label: m.assessed,
      values: [currentEntry.count, previousEntry.count],
      formatter: format.integer,
    },
  ];

  return (
    <div className="table">
      <table className="workspace-comparison" aria-label={m.cohort}>
        <thead>
          <tr>
            <th scope="col">{m.metric}</th>
            <th scope="col">{currentLabel}</th>
            <th scope="col">{previousLabel}</th>
            {showChange && <th scope="col">{m.change}</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map(
            ({
              label,
              values,
              formatter,
              signed,
              baseline,
              lowerIsBetter,
              bars,
            }) => {
              const [a, b] = values;
              const delta =
                a !== null &&
                b !== null &&
                Number.isFinite(a) &&
                Number.isFinite(b)
                  ? a - b
                  : null;
              const multiplier = lowerIsBetter ? -1 : 1;
              const relative = formatter === format.percentage;
              return (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  {periods.map((index) => {
                    const value = values[index];
                    const tone =
                      value === null || baseline === undefined
                        ? undefined
                        : numericTone((value - baseline) * multiplier);
                    const bar = bars?.[index];
                    return (
                      <td key={index}>
                        {value === null ? (
                          <span className="comparison-missing">
                            {EMPTY_VALUE}
                          </span>
                        ) : (
                          <div className="comparison-cell">
                            <span className="comparison-value" data-tone={tone}>
                              {signed && value > 0 ? "+" : ""}
                              {formatter.format(value)}
                            </span>
                            {bar && <MetricBar {...bar} />}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  {showChange && (
                    <td>
                      {delta === null ? (
                        <span className="comparison-missing">
                          {EMPTY_VALUE}
                        </span>
                      ) : (
                        <span
                          className="comparison-value"
                          data-tone={
                            baseline !== undefined || relative
                              ? numericTone(delta * multiplier)
                              : undefined
                          }
                        >
                          {delta > 0 ? "+" : ""}
                          {relative
                            ? format.money.format(delta * 100) +
                              " " +
                              m.percentagePoints
                            : formatter.format(delta)}
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              );
            },
          )}
        </tbody>
      </table>
    </div>
  );
}
