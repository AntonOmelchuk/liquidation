import { OPEN_POSITION_HREF } from "../../../app/constants.ts";
import { tradeAccountKey } from "@liquidation/domain/trades/trade-tags";
import { useLocale } from "../../../shared/messages.ts";
import { InfoTip } from "../../../shared/ui/info-tip.tsx";
import { Panel } from "../../../shared/ui/layout.tsx";
import { useJournal } from "../data/store.ts";
import { TradeTable } from "./trade-table.tsx";
import { useTradeRecordMessages } from "./messages.ts";
import { TRADE_TABLE_MODE } from "./constants.ts";
import type { OpenPositionsProps } from "./types.ts";

export function OpenPositions({ ready, account }: OpenPositionsProps) {
  const { t } = useLocale();
  const m = useTradeRecordMessages();
  const positions = useJournal((state) => state.positions).filter(
    (position) =>
      account === undefined || tradeAccountKey(position) === account,
  );
  return (
    <Panel
      title={t.openPositions}
      detail={
        <div className="trade-list-toolbar">
          <InfoTip label={m.positionDetails} text={m.compactHelp} />
          {ready ? (
            <a className="action-link secondary" href={OPEN_POSITION_HREF}>
              <span aria-hidden="true">＋</span> {t.openPosition}
            </a>
          ) : (
            <button type="button" className="secondary" disabled>
              {t.openPosition}
            </button>
          )}
        </div>
      }
    >
      {ready && <TradeTable trades={positions} mode={TRADE_TABLE_MODE.OPEN} />}
    </Panel>
  );
}
