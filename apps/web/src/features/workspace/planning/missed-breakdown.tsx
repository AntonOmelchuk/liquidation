import type { missedStatistics } from "@liquidation/domain/analytics/missed-statistics";
import { EMPTY_VALUE } from "../../../shared/constants.ts";
import { numericTone } from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import { InstrumentLabel } from "../../../shared/ui/instrument-label.tsx";
import { RecordTable } from "../../../shared/ui/record-table.tsx";
import { usePlanningMessages } from "./messages.ts";

export function MissedBreakdown({
  statistics,
}: {
  statistics: ReturnType<typeof missedStatistics>;
}) {
  const { t, format } = useLocale();
  const m = usePlanningMessages();
  const groups = [
    {
      label: m.byReason,
      column: m.reason,
      rows: statistics.reasons.map((row) => ({ ...row, name: m[row.key] })),
    },
    {
      label: m.byInstrument,
      column: t.symbol,
      rows: statistics.instruments.map((row) => ({
        ...row,
        name: <InstrumentLabel symbol={row.key} />,
      })),
    },
  ];
  return (
    <section className="layout">
      <div>
        <h3>{m.missedBreakdown}</h3>
        <p className="muted">{m.missedAnalyticsHint}</p>
      </div>
      <div className="record-analysis-grid">
        {groups.map(({ label, column, rows }) => (
          <section key={label}>
            <h4>{label}</h4>
            <RecordTable label={label}>
              <thead>
                <tr>
                  <th scope="col">{column}</th>
                  <th scope="col">{m.missedCount}</th>
                  <th scope="col">{m.beAssessed}</th>
                  <th scope="col">{m.netRColumn}</th>
                  <th scope="col">{m.estimatedPnl}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ key, name, count, assessed, netR, cash }) => (
                  <tr key={key}>
                    <th scope="row">{name}</th>
                    <td>{format.integer.format(count)}</td>
                    <td>{format.integer.format(assessed)}</td>
                    <td className={numericTone(netR ?? 0)}>
                      {netR === null
                        ? EMPTY_VALUE
                        : format.money.format(netR) + " R"}
                    </td>
                    <td className={numericTone(cash ?? 0)}>
                      {cash === null
                        ? EMPTY_VALUE
                        : format.money.format(cash / 100)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </RecordTable>
          </section>
        ))}
      </div>
    </section>
  );
}
