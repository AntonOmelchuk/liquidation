import { recentTradeReview } from "@liquidation/domain/workspace/analytics";
import { RECENT_TRADE_COUNT } from "@liquidation/domain/workspace/constants";
import type { Trade } from "@liquidation/domain/trades/types";
import { useMemo } from "react";
import { Panel } from "../../../shared/ui/layout.tsx";
import { TradeTable } from "../../journal/records/trade-table.tsx";
import { useWorkspaceMessages } from "../messages.ts";
import { ComparisonTable } from "./comparison-table.tsx";
import { MistakeSummary } from "./mistake-summary.tsx";

export function RecentReview({ trades }: { trades: readonly Trade[] }) {
  const m = useWorkspaceMessages();
  const { current, previous } = useMemo(
    () => recentTradeReview(trades),
    [trades],
  );
  const comparable =
    current.length === RECENT_TRADE_COUNT &&
    previous.length === RECENT_TRADE_COUNT;
  return (
    <div className="layout">
      <Panel title={m.recent}>
        <p>{m.recentHint}</p>
        {!comparable && <p role="status">{m.insufficient}</p>}
        <ComparisonTable
          current={current}
          previous={previous}
          currentLabel={m.currentRecent}
          previousLabel={m.previousRecent}
          showChange={comparable}
        />
      </Panel>
      <MistakeSummary trades={current} />
      <Panel title={m.currentRecent} detail={current.length}>
        <TradeTable trades={current} />
      </Panel>
      {previous.length > 0 && (
        <Panel title={m.previousRecent} detail={previous.length}>
          <TradeTable trades={previous} />
        </Panel>
      )}
    </div>
  );
}
