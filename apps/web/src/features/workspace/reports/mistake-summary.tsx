import type { Trade } from "@liquidation/domain/trades/types";
import { netCents } from "@liquidation/domain/trades/trade";
import { useLocale } from "../../../shared/messages.ts";
import { Panel } from "../../../shared/ui/layout.tsx";
import { useWorkspaceMessages } from "../messages.ts";

export function MistakeSummary({ trades }: { trades: readonly Trade[] }) {
  const { t, format } = useLocale();
  const m = useWorkspaceMessages();
  const rows = new Map<string, { label: string; count: number; net: number }>();
  for (const trade of trades) {
    const labels = new Map(
      trade.mistakes?.map((label) => [label.trim().toLowerCase(), label]),
    );
    for (const [key, label] of labels) {
      const row = rows.get(key) ?? { label, count: 0, net: 0 };
      row.count += 1;
      row.net += netCents(trade);
      rows.set(key, row);
    }
  }
  const report = [...rows.values()].sort(
    (a, b) =>
      b.count - a.count || a.net - b.net || a.label.localeCompare(b.label),
  );
  return (
    <Panel title={m.topMistakes}>
      {report.length ? (
        <div className="table">
          <table aria-label={m.topMistakes}>
            <thead>
              <tr>
                <th scope="col">{t.mistakes}</th>
                <th scope="col">{t.count}</th>
                <th scope="col">{t.pnl}</th>
              </tr>
            </thead>
            <tbody>
              {report.map(({ label, count, net }) => (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  <td>{format.integer.format(count)}</td>
                  <td>{format.money.format(net / 100)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>{m.noMistakes}</p>
      )}
    </Panel>
  );
}
