import { PAGE_VIEW } from "../../../app/constants.ts";
import type { PlanLinkedTradesProps } from "./types.ts";

import { netCents, realizedR } from "@liquidation/domain/trades/trade";
import { planHref, tradeLinksHref } from "../../../app/page.ts";
import { EMPTY_VALUE } from "../../../shared/constants.ts";
import { numericTone } from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import { InstrumentIcons } from "../../../shared/ui/instrument-picker.tsx";
import { Metric, Panel } from "../../../shared/ui/layout.tsx";
import { usePlanMessages } from "../messages.ts";

export function PlanLinkedTrades({
  planId,
  data,
  trades,
  positions,
}: PlanLinkedTradesProps) {
  const { t, format } = useLocale();
  const p = usePlanMessages();
  const { actual, narrative, alignment } = data;
  const number = (value: number) => format.integer.format(value);
  const r = (value: number | null) =>
    value === null ? EMPTY_VALUE : `${format.money.format(value)} R`;
  const records = [...trades, ...positions].sort(
    (a, b) => Date.parse(b.openedAt) - Date.parse(a.openedAt),
  );

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
            {p.plannedBias} · {p[narrative]}
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
        <div className="table plan-linked-table">
          <table aria-label={p.linked}>
            <thead>
              <tr>
                <th scope="col">{t.symbol}</th>
                <th scope="col">{t.side}</th>
                <th scope="col">{p.tradeState}</th>
                <th scope="col">{p.entryDate}</th>
                <th scope="col">{p.exitDate}</th>
                <th scope="col">{p.realizedPnl}</th>
                <th scope="col">{t.result}</th>
                <th scope="col">{t.tradeLinks}</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => {
                const trade = "closedAt" in record ? record : null;
                const pnl = trade ? netCents(trade) / 100 : null;
                return (
                  <tr key={record.id}>
                    <th scope="row">
                      <span className="instrument-label">
                        <InstrumentIcons symbol={record.symbol} />
                        {record.symbol}
                      </span>
                    </th>
                    <td>{t[record.direction]}</td>
                    <td>{trade ? p.closedState : p.openState}</td>
                    <td>
                      <time dateTime={record.openedAt}>
                        {format.date.format(Date.parse(record.openedAt))}
                      </time>
                    </td>
                    <td>
                      {trade ? (
                        <time dateTime={trade.closedAt}>
                          {format.date.format(Date.parse(trade.closedAt))}
                        </time>
                      ) : (
                        EMPTY_VALUE
                      )}
                    </td>
                    <td className={numericTone(pnl ?? 0)}>
                      {pnl === null ? EMPTY_VALUE : format.money.format(pnl)}
                    </td>
                    <td>{r(trade && realizedR(trade))}</td>
                    <td>
                      {trade ? (
                        <a
                          className="record-link"
                          href={tradeLinksHref(trade.id)}
                        >
                          {t.editTradeLinks}
                        </a>
                      ) : (
                        EMPTY_VALUE
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
