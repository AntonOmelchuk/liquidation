import {
  GroupCheckbox,
  GroupCheckboxHeader,
  GroupSelectionSummary,
  useTradeGroupSelection,
} from "./group-selection.tsx";
import { STAT_PERIOD } from "@liquidation/domain/analytics/constants";
import { periodStatistics } from "@liquidation/domain/analytics/period-statistics";
import type { StatisticsPeriod } from "@liquidation/domain/analytics/types";
import {
  calendarDate,
  periodBounds,
} from "@liquidation/domain/workspace/period";
import { useState } from "react";
import { EMPTY_VALUE, LOCALES } from "../../shared/constants.ts";
import { numericTone } from "../../shared/format.ts";
import { useLocale } from "../../shared/messages.ts";
import { Panel } from "../../shared/ui/layout.tsx";
import { SelectField } from "../../shared/ui/select-field.tsx";
import { TradeTable } from "../journal/records/trade-table.tsx";
import { useAdvancedStatisticsMessages } from "./advanced-messages.ts";
import type { TradeAnalysisProps } from "./types.ts";

export function PeriodBreakdown({ trades }: TradeAnalysisProps) {
  const { t, format, language } = useLocale();
  const a = useAdvancedStatisticsMessages();
  const [period, setPeriod] = useState<StatisticsPeriod>(STAT_PERIOD.MONTH);
  const [selected, setSelected] = useState<string>();
  const rows = periodStatistics(trades, period);
  const selection = useTradeGroupSelection(rows);
  const active = rows.find((row) => row.key === selected);
  const money = (value: number | null) =>
    value === null ? EMPTY_VALUE : format.money.format(value);
  function label(key: string) {
    if (period === STAT_PERIOD.YEAR) return key;
    if (period === STAT_PERIOD.QUARTER)
      return (
        "Q" +
        (Math.floor(calendarDate(key).getUTCMonth() / 3) + 1) +
        " · " +
        key.slice(0, 4)
      );
    if (period === STAT_PERIOD.MONTH)
      return new Intl.DateTimeFormat(LOCALES[language], {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(calendarDate(key));
    if (period === STAT_PERIOD.WEEK)
      return format.day.formatRange(
        calendarDate(key),
        calendarDate(periodBounds(period, key).through),
      );
    return format.day.format(calendarDate(key));
  }
  return (
    <Panel
      title={a.periodBreakdown}
      detail={
        <SelectField
          label={a.group}
          value={period}
          onChange={(event) => {
            const next = Object.values(STAT_PERIOD).find(
              (key) => key === event.target.value,
            );
            if (next) {
              setPeriod(next);
              setSelected(undefined);
              selection.clear();
            }
          }}
        >
          {Object.values(STAT_PERIOD).map((key) => (
            <option key={key} value={key}>
              {a[key]}
            </option>
          ))}
        </SelectField>
      }
    >
      {rows.length ? (
        <div className="table compact-record-table">
          <table aria-label={a.periodBreakdown}>
            <thead>
              <tr>
                <GroupCheckboxHeader selection={selection} />
                <th>{a.group}</th>
                <th>{t.count}</th>
                <th>WR</th>
                <th>{t.pnl}</th>
                <th>PF</th>
                <th>Σ R</th>
                <th>EV (R)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ key, metrics }) => (
                <tr key={key}>
                  <GroupCheckbox
                    selection={selection}
                    groupKey={key}
                    label={label(key)}
                  />
                  <th scope="row">
                    <button
                      className="secondary"
                      type="button"
                      aria-pressed={key === selected}
                      onClick={() =>
                        setSelected((current) =>
                          current === key ? undefined : key,
                        )
                      }
                    >
                      {label(key)}
                    </button>
                  </th>
                  <td>{metrics.count}</td>
                  <td>
                    {metrics.winRate === null
                      ? EMPTY_VALUE
                      : format.percentage.format(metrics.winRate)}
                  </td>
                  <td className={numericTone(metrics.net)}>
                    {money(metrics.net)}
                  </td>
                  <td>{money(metrics.profitFactor)}</td>
                  <td>{money(metrics.totalR)}</td>
                  <td>{money(metrics.expectancyR)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>{t.noTrades}</p>
      )}
      <GroupSelectionSummary selection={selection} />
      {active && <TradeTable trades={active.records} />}
    </Panel>
  );
}
