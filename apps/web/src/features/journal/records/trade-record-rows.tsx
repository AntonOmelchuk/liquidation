import { netCents, realizedR } from "@liquidation/domain/trades/trade";
import { localDay } from "@liquidation/domain/workspace/period";
import { EMPTY_VALUE } from "../../../shared/constants.ts";
import { formatCompactDay, numericTone } from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import { TradeSideBadge } from "../../../shared/ui/direction-badge.tsx";
import { InstrumentIcons } from "../../../shared/ui/instrument-picker.tsx";
import { PositionNewsBadge } from "../../market/position-news-badge.tsx";
import { TRADE_RESULT } from "./constants.ts";
import { useTradeRecordMessages } from "./messages.ts";
import type { TradeRecordRowsProps } from "./types.ts";

export function TradeRecordRows({
  records,
  onInspect,
  showFinancialResult,
}: TradeRecordRowsProps) {
  const { format } = useLocale();
  const m = useTradeRecordMessages();
  return records.map((record) => {
    const trade = "closedAt" in record ? record : undefined;
    const net = trade ? netCents(trade) / 100 : null;
    const r = trade ? realizedR(trade) : null;
    const at = trade?.closedAt ?? record.openedAt;
    const fullDate = format.date.format(Date.parse(at));
    const outcome =
      net === null
        ? record.breakeven
          ? TRADE_RESULT.BE
          : TRADE_RESULT.OPEN
        : net > 0
          ? TRADE_RESULT.WIN
          : net < 0
            ? TRADE_RESULT.LOSS
            : TRADE_RESULT.FLAT;
    return (
      <tr
        className="trade-ledger-row"
        key={record.id}
        data-record-id={record.id}
        onClick={() => onInspect(record.id)}
      >
        <td>
          <time dateTime={at} title={fullDate}>
            {formatCompactDay(localDay(at))}
          </time>
        </td>
        <td title={record.account} className="trade-ledger-clip">
          {record.account || EMPTY_VALUE}
        </td>
        <th scope="row">
          <button
            type="button"
            className="trade-ledger-symbol"
            aria-label={m.view + " · " + record.symbol + " · " + fullDate}
            onClick={(event) => {
              event.stopPropagation();
              onInspect(record.id);
            }}
          >
            <InstrumentIcons symbol={record.symbol} />
            {record.symbol}
          </button>
          {!trade && <PositionNewsBadge symbol={record.symbol} />}
        </th>
        <td>
          <TradeSideBadge side={record.direction} />
        </td>
        <td title={record.style} className="trade-ledger-clip">
          {record.style || EMPTY_VALUE}
        </td>
        <td>{record.timeframe?.toUpperCase() || EMPTY_VALUE}</td>
        <td className="trade-number">
          {record.riskSizing
            ? format.riskPercent.format(record.riskSizing.percent / 100)
            : record.risk === null
              ? EMPTY_VALUE
              : format.money.format(record.risk)}
        </td>
        <td>
          <span className="trade-outcome" data-outcome={outcome}>
            {m[outcome]}
          </span>
        </td>
        {showFinancialResult && (
          <>
            <td className={"trade-number " + (numericTone(net ?? 0) ?? "")}>
              {net === null ? EMPTY_VALUE : format.money.format(net)}
            </td>
            <td className={"trade-number " + (numericTone(r ?? 0) ?? "")}>
              {r === null ? EMPTY_VALUE : format.money.format(r)}
            </td>
          </>
        )}
      </tr>
    );
  });
}
