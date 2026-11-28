import { TRADE_RESULT } from "./constants.ts";
import { useTradeRecordMessages } from "./messages.ts";
import type { TradeResult } from "./types.ts";

export function tradeResult(
  net: number | null,
  breakeven?: boolean,
): TradeResult {
  if (net === null) return breakeven ? TRADE_RESULT.BE : TRADE_RESULT.OPEN;
  if (net > 0) return TRADE_RESULT.WIN;
  return net < 0 ? TRADE_RESULT.LOSS : TRADE_RESULT.FLAT;
}

export function TradeOutcomeBadge({ outcome }: { outcome: TradeResult }) {
  const m = useTradeRecordMessages();
  return (
    <span className="trade-outcome" data-outcome={outcome}>
      {m[outcome]}
    </span>
  );
}
