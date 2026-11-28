import { selectedGroupTrades } from "@liquidation/domain/analytics/group-selection";
import { tradeStatistics } from "@liquidation/domain/analytics/trade-statistics";
import type { TradeGroupRecords } from "@liquidation/domain/analytics/types";
import { useState } from "react";
import { EMPTY_VALUE } from "../../shared/constants.ts";
import { numericTone } from "../../shared/format.ts";
import { useLocale } from "../../shared/messages.ts";
import { CheckboxField } from "../../shared/ui/checkbox-field.tsx";
import { useStatisticsMessages } from "./messages.ts";
import type { GroupCheckboxProps, GroupSelectionProps } from "./types.ts";

export function useTradeGroupSelection(groups: readonly TradeGroupRecords[]) {
  const [selected, setSelected] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const keys = new Set(
    groups.filter(({ key }) => selected.has(key)).map(({ key }) => key),
  );
  const all = groups.length > 0 && keys.size === groups.length;
  const records = selectedGroupTrades(groups, keys);
  return {
    keys,
    all,
    partial: Boolean(keys.size && !all),
    records,
    metrics: tradeStatistics(records),
    toggle(key: string) {
      setSelected((previous) => {
        const next = new Set(previous);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    },
    toggleAll() {
      setSelected(all ? new Set() : new Set(groups.map(({ key }) => key)));
    },
    clear() {
      setSelected(new Set());
    },
  };
}

export function GroupCheckboxHeader({ selection }: GroupSelectionProps) {
  const s = useStatisticsMessages();
  return (
    <th scope="col" className="group-check-cell" title={s.chosenHint}>
      <CheckboxField
        aria-label={s.selectAllGroups}
        checked={selection.all}
        indeterminate={selection.partial}
        onChange={selection.toggleAll}
      />
    </th>
  );
}

export function GroupCheckbox({
  selection,
  groupKey,
  label,
}: GroupCheckboxProps) {
  const s = useStatisticsMessages();
  return (
    <td className="group-check-cell">
      <CheckboxField
        aria-label={s.selectGroups + " · " + label}
        checked={selection.keys.has(groupKey)}
        onChange={() => selection.toggle(groupKey)}
      />
    </td>
  );
}

export function GroupSelectionSummary({ selection }: GroupSelectionProps) {
  const { t, format } = useLocale();
  const s = useStatisticsMessages();
  const { metrics, keys } = selection;
  if (!keys.size) return null;
  const amount = (value: number | null) =>
    value === null ? EMPTY_VALUE : format.money.format(value);
  return (
    <div className="selected-group-summary" role="status">
      <strong>
        {s.chosenTotal} · {keys.size}
      </strong>
      <span>
        {s.tradeCount} <b>{metrics.count}</b>
      </span>
      <span>
        WR{" "}
        <b>
          {metrics.winRate === null
            ? EMPTY_VALUE
            : format.percentage.format(metrics.winRate)}
        </b>
      </span>
      <span>
        {t.pnl}{" "}
        <b className={numericTone(metrics.net)}>{amount(metrics.net)}</b>
      </span>
      <span>
        PF <b>{amount(metrics.profitFactor)}</b>
      </span>
      <span>
        Σ R{" "}
        <b className={numericTone(metrics.totalR ?? 0)}>
          {amount(metrics.totalR)}
        </b>
      </span>
    </div>
  );
}
