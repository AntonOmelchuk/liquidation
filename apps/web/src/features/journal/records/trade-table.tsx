import { netCents, realizedR } from "@liquidation/domain/trades/trade";
import { tradeLinksHref } from "../../../app/page.ts";
import { EMPTY_VALUE } from "../../../shared/constants.ts";
import { numericTone } from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import { InstrumentIcons } from "../../../shared/ui/instrument-picker.tsx";
import { TradeAssociations } from "./trade-associations.tsx";
import type { TradeTableProps } from "./types.ts";

export function TradeTable({ trades }: TradeTableProps) {
  const {
    t,
    format: { money, date },
  } = useLocale();
  if (!trades.length) return <p>{t.noTrades}</p>;
  return (
    <div className="table">
      <table>
        <thead>
          <tr>
            <th>{t.symbol}</th>
            <th>{t.side}</th>
            <th>{t.closed}</th>
            <th>{t.pnl}</th>
            <th>{t.result}</th>
            <th>{t.tradeLinks}</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => {
            const net = netCents(trade) / 100;
            const multiple = realizedR(trade);
            return (
              <tr key={trade.id}>
                <th scope="row">
                  <span className="instrument-label">
                    <InstrumentIcons symbol={trade.symbol} />
                    {trade.symbol}
                  </span>
                  <TradeAssociations {...trade} />
                  {trade.notes && <small>{trade.notes}</small>}
                </th>
                <td>{t[trade.direction]}</td>
                <td>{date.format(new Date(trade.closedAt))}</td>
                <td className={numericTone(net)}>{money.format(net)}</td>
                <td>
                  {multiple === null ? EMPTY_VALUE : money.format(multiple)}
                </td>
                <td>
                  <a className="record-link" href={tradeLinksHref(trade.id)}>
                    {t.editTradeLinks}
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
