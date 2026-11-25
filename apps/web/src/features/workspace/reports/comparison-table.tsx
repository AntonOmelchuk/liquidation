import { tradeStatistics } from "@liquidation/domain/analytics/trade-statistics";
import { adherence } from "@liquidation/domain/playbooks/playbook-performance";
import { useMemo } from "react";
import { EMPTY_VALUE } from "../../../shared/constants.ts";
import { useLocale } from "../../../shared/messages.ts";
import { useWorkspaceMessages } from "../messages.ts";
import { ENTRY_CHECKLIST } from "./constants.ts";
import type { ComparisonProps } from "./types.ts";

export function ComparisonTable({
  current,
  previous,
  currentLabel,
  previousLabel,
  showChange,
}: ComparisonProps) {
  const { t, format } = useLocale();
  const m = useWorkspaceMessages();
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
  const rows = [
    [t.count, now.count, before.count, format.integer],
    [
      t.pnl,
      now.count ? now.net : null,
      before.count ? before.net : null,
      format.money,
    ],
    [t.win, now.winRate, before.winRate, format.percentage],
    [t.profitFactor, now.profitFactor, before.profitFactor, format.money],
    [m.expectancy, now.expectancy, before.expectancy, format.money],
    [m.averageR, now.expectancyR, before.expectancyR, format.money],
    [m.riskCount, now.countWithRisk, before.countWithRisk, format.integer],
    [
      m.maxDrawdown,
      now.count ? now.maxDrawdown : null,
      before.count ? before.maxDrawdown : null,
      format.money,
    ],
    [m.adherence, currentEntry.rate, previousEntry.rate, format.percentage],
    [m.assessed, currentEntry.count, previousEntry.count, format.integer],
  ] as const;

  const formatValue = (value: number | null, formatter: Intl.NumberFormat) =>
    value === null ? EMPTY_VALUE : formatter.format(value);

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
          {rows.map(([label, a, b, formatter]) => {
            const delta =
              a !== null &&
              b !== null &&
              Number.isFinite(a) &&
              Number.isFinite(b)
                ? a - b
                : null;
            return (
              <tr key={label}>
                <th scope="row">{label}</th>
                <td>{formatValue(a, formatter)}</td>
                <td>{formatValue(b, formatter)}</td>
                {showChange && (
                  <td>
                    {delta === null
                      ? EMPTY_VALUE
                      : (delta > 0 ? "+" : "") +
                        (formatter === format.percentage
                          ? format.price.format(delta * 100) + " pp"
                          : formatter.format(delta))}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
