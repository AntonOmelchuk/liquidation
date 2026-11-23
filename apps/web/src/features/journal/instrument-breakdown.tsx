import { performanceByInstrument } from "@liquidation/domain/analytics/instrument-performance";
import type { InstrumentBreakdownProps } from "./types.ts";

import { EMPTY_VALUE } from "../../shared/constants.ts";
import { numericTone } from "../../shared/format.ts";
import { useLocale } from "../../shared/messages.ts";
import { InstrumentIcons } from "../../shared/ui/instrument-picker.tsx";

export function InstrumentBreakdown({ trades }: InstrumentBreakdownProps) {
  const { t, format } = useLocale();
  const rows = performanceByInstrument(trades);
  if (!rows.length) return <p>{t.noMatches}</p>;

  return (
    <div className="table instrument-breakdown">
      <table aria-label={t.instrumentPerformance}>
        <thead>
          <tr>
            <th scope="col">{t.symbol}</th>
            <th scope="col">{t.count}</th>
            <th scope="col">{t.win}</th>
            <th scope="col">{t.pnl}</th>
            <th scope="col">
              <abbr title={t.profitFactor}>PF</abbr>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.symbol}>
              <th scope="row">
                <span className="instrument-label">
                  <InstrumentIcons symbol={row.symbol} />
                  {row.symbol}
                </span>
              </th>
              <td>{format.integer.format(row.count)}</td>
              <td>{format.percentage.format(row.winRate)}</td>
              <td className={numericTone(row.net)}>
                {format.money.format(row.net)}
              </td>
              <td>
                {row.profitFactor === null
                  ? EMPTY_VALUE
                  : format.money.format(row.profitFactor)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
