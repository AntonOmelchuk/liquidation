import { summarizeBreakevenReviews } from "@liquidation/domain/analytics/breakeven-review";
import type { MissedTrade } from "@liquidation/domain/workspace/types";
import { EMPTY_VALUE } from "../../../shared/constants.ts";
import { numericTone } from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import { usePlanningMessages } from "./messages.ts";

export function BreakevenReviewSummary({
  records,
}: {
  records: readonly MissedTrade[];
}) {
  const { t, format } = useLocale();
  const m = usePlanningMessages();
  const { rows, total } = summarizeBreakevenReviews(records);
  if (!total.count) return null;

  const coverage = (measured: number, count: number) =>
    measured < count && (
      <small>
        {m.beAssessed} {format.integer.format(measured)}/
        {format.integer.format(count)}
      </small>
    );
  return (
    <section className="breakeven-review-summary" aria-label={m.beEffect}>
      <h3>{m.beEffect}</h3>
      <div className="table compact-record-table">
        <table aria-label={m.beEffect}>
          <thead>
            <tr>
              <th scope="col">{m.reason}</th>
              <th scope="col">{t.count}</th>
              <th scope="col">{m.netRColumn}</th>
              <th scope="col">{m.estimatedCashColumn}</th>
            </tr>
          </thead>
          <tbody>
            {[
              ...rows.map((row) => ({ ...row, label: m[row.reason] })),
              { ...total, label: m.beNetEffect },
            ].map(
              ({
                label,
                count,
                assessed,
                measuredCash,
                effectR,
                effectCents,
              }) => (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  <td>{format.integer.format(count)}</td>
                  <td className={numericTone(effectR ?? 0)}>
                    {effectR === null
                      ? EMPTY_VALUE
                      : format.money.format(effectR) + " R"}
                    {coverage(assessed, count)}
                  </td>
                  <td className={numericTone(effectCents ?? 0)}>
                    {effectCents === null
                      ? EMPTY_VALUE
                      : format.money.format(effectCents / 100)}
                    {coverage(measuredCash, count)}
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
