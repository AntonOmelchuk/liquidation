import { PAGE_VIEW } from "../../../app/constants.ts";
import type { PlanLinkedTradesProps } from "./types.ts";

import { planHref } from "../../../app/page.ts";
import { EMPTY_VALUE } from "../../../shared/constants.ts";
import { useLocale } from "../../../shared/messages.ts";
import { DirectionBadge } from "../../../shared/ui/direction-badge.tsx";
import { Metric, Panel } from "../../../shared/ui/layout.tsx";
import { TradeTable } from "../../journal/records/trade-table.tsx";
import { TRADE_TABLE_MODE } from "../../journal/records/constants.ts";
import { usePlanMessages } from "../messages.ts";

export function PlanLinkedTrades({
  planId,
  data,
  trades,
  positions,
}: PlanLinkedTradesProps) {
  const { format } = useLocale();
  const p = usePlanMessages();
  const { actual, narrative, alignment } = data;
  const number = (value: number) => format.integer.format(value);
  const r = (value: number | null) =>
    value === null ? EMPTY_VALUE : `${format.money.format(value)} R`;
  const records = [...trades, ...positions];

  return (
    <Panel
      title={p.executionStats}
      detail={
        <a
          className="action-link secondary"
          href={planHref(planId, PAGE_VIEW.TRADES)}
        >
          {p.manageTrades}
        </a>
      }
    >
      <div className="metrics plan-metrics">
        <Metric
          label={p.tradeWinRate}
          value={
            actual.winRate === null
              ? EMPTY_VALUE
              : format.percentage.format(actual.winRate)
          }
          detail={`${p.wins} ${number(actual.wins)} · ${p.losses} ${number(actual.losses)} · ${p.flat} ${number(actual.flat)}`}
        />
        <Metric
          label={p.realizedPnl}
          value={actual.closed ? format.money.format(actual.net) : EMPTY_VALUE}
          detail={`${p.closedTrades} ${number(actual.closed)} · ${p.openTrades} ${number(actual.open)}`}
        />
        <Metric
          label={p.totalR}
          value={r(actual.totalR)}
          detail={
            actual.missingRisk
              ? `${p.riskMissing} · ${number(actual.missingRisk)}`
              : undefined
          }
        />
      </div>

      {alignment && actual.count > 0 && (
        <div className="plan-alignment">
          <h3>{p.alignment}</h3>
          <p>
            {p.plannedBias} ·{" "}
            <DirectionBadge direction={narrative}>
              {p[narrative]}
            </DirectionBadge>
          </p>
          {(["withNarrative", "againstNarrative"] as const).map((key) => (
            <div className="plan-alignment-row" key={key}>
              <span>{p[key]}</span>
              <strong>
                {number(alignment[key].count)} · {r(alignment[key].totalR)}
              </strong>
            </div>
          ))}
        </div>
      )}
      {actual.count === 0 ? (
        <p>{p.noLinkedTrades}</p>
      ) : (
        <TradeTable
          trades={records}
          mode={TRADE_TABLE_MODE.MIXED}
          label={p.linked}
        />
      )}
    </Panel>
  );
}
