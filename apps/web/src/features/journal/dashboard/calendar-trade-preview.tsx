import { netCents } from "@liquidation/domain/trades/trade";
import { EMPTY_VALUE } from "../../../shared/constants.ts";
import { numericTone } from "../../../shared/format.ts";
import { useWorkspaceMessages } from "../../workspace/messages.ts";
import { useTradeRecordMessages } from "../records/messages.ts";
import { newestTradeRecord } from "../records/order.ts";
import { CALENDAR_TRADE_PREVIEW_LIMIT } from "./constants.ts";
import type { CalendarTradePreviewProps } from "./types.ts";

export function CalendarTradePreview({
  id,
  day,
  money,
}: CalendarTradePreviewProps) {
  const m = useWorkspaceMessages();
  const labels = useTradeRecordMessages();
  const limit = CALENDAR_TRADE_PREVIEW_LIMIT;
  const open = day.positions
    .toSorted(newestTradeRecord)
    .slice(0, day.trades.length ? limit - 1 : limit);
  const closed = day.trades
    .toSorted(newestTradeRecord)
    .slice(0, limit - open.length);
  const records = [...closed, ...open].sort(newestTradeRecord);
  const more = day.trades.length + day.positions.length - records.length;
  return (
    <span className="calendar-trade-preview" id={id}>
      {records.map((record) => {
        const profit =
          "closedAt" in record ? netCents(record) / 100 : undefined;
        const risk = record.breakeven ? 0 : record.risk;
        return (
          <span
            className="calendar-trade-line"
            key={record.id}
            data-position={profit === undefined || undefined}
          >
            <b title={record.symbol}>{record.symbol}</b>
            {profit === undefined ? (
              <span>
                {labels.risk} {risk === null ? EMPTY_VALUE : money.format(risk)}
              </span>
            ) : (
              <span className={numericTone(profit)}>
                {profit > 0 && "+"}
                {money.format(profit)}
              </span>
            )}
          </span>
        );
      })}
      {more > 0 && (
        <span className="calendar-trade-more">
          {m.calendarMore} {more}
        </span>
      )}
    </span>
  );
}
