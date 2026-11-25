import { TRADE_FACTOR } from "@liquidation/domain/analytics/constants";
import { tradeBreakdown } from "@liquidation/domain/analytics/trade-factors";
import { realizedR } from "@liquidation/domain/trades/trade";
import { reportCoverage } from "@liquidation/domain/workspace/report-index";
import { PERIOD } from "@liquidation/domain/workspace/constants";
import { calendarDate } from "@liquidation/domain/workspace/period";
import { reportHref, tradeLinksHref } from "../../../app/page.ts";
import { EMPTY_VALUE } from "../../../shared/constants.ts";
import { numericTone } from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import { Panel } from "../../../shared/ui/layout.tsx";
import { useJournal } from "../../journal/data/store.ts";
import { RiskAnalysis } from "../../statistics/risk-analysis.tsx";
import { EvidenceStatistics } from "../../statistics/evidence-statistics.tsx";
import { PeriodBreakdown } from "../../statistics/period-breakdown.tsx";
import { useAdvancedStatisticsMessages } from "../../statistics/advanced-messages.ts";
import { useReportIndexMessages } from "./index-messages.ts";
import type { PeriodInsightsProps } from "./types.ts";

export function PeriodInsights({ trades, period, start }: PeriodInsightsProps) {
  const { t, format } = useLocale();
  const c = useReportIndexMessages();
  const a = useAdvancedStatisticsMessages();
  const journal = useJournal();
  const coverage = reportCoverage(
    {
      trades: journal.trades ?? [],
      positions: journal.positions,
      reports: journal.workspace.reports,
    },
    period,
    start,
  );
  const measured = trades
    .flatMap((trade) => {
      const r = realizedR(trade);
      return r === null ? [] : [{ trade, r }];
    })
    .sort((left, right) => right.r - left.r);
  const extremes = [
    [a.bestR, measured[0]],
    [a.worstR, measured.at(-1)],
  ] as const;
  const groups = tradeBreakdown(trades, TRADE_FACTOR.ACCOUNT);
  const money = (value: number | null) =>
    value === null ? EMPTY_VALUE : format.money.format(value);
  return (
    <>
      <div className="analysis-chart-grid">
        <Panel
          title={c.coverage}
          detail={coverage.reviewedDays + "/" + coverage.tradingDays}
        >
          <p>{c.coverageHint}</p>
          {coverage.missingDays.length > 0 && (
            <details className="analytics-more">
              <summary>
                {c.missingReviews} · {coverage.missingDays.length}
              </summary>
              <div className="workspace-actions">
                {coverage.missingDays.map((day) => (
                  <a
                    key={day}
                    className="record-link"
                    href={reportHref(PERIOD.DAY, day)}
                  >
                    {format.day.format(calendarDate(day))}
                  </a>
                ))}
              </div>
            </details>
          )}
        </Panel>
        <Panel title={a.netR}>
          <dl className="statistics-facts">
            {extremes.map(([label, record]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>
                  {record ? (
                    <>
                      <a
                        className="record-link"
                        href={tradeLinksHref(record.trade.id)}
                      >
                        {record.trade.symbol}
                      </a>{" "}
                      ·{" "}
                      <span className={numericTone(record.r)}>
                        {money(record.r)} R
                      </span>
                    </>
                  ) : (
                    EMPTY_VALUE
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>
      <Panel title={c.financialSummary}>
        {groups.length ? (
          <div className="table compact-record-table">
            <table aria-label={c.financialSummary}>
              <thead>
                <tr>
                  <th>{t.account}</th>
                  <th>{t.count}</th>
                  <th>WR</th>
                  <th>PF</th>
                  <th>{t.pnl}</th>
                  <th>Σ R</th>
                </tr>
              </thead>
              <tbody>
                {groups.map(({ key, metrics, records }) => (
                  <tr key={key}>
                    <th scope="row">{records[0].account || EMPTY_VALUE}</th>
                    <td>{metrics.count}</td>
                    <td>
                      {metrics.winRate === null
                        ? EMPTY_VALUE
                        : format.percentage.format(metrics.winRate)}
                    </td>
                    <td>{money(metrics.profitFactor)}</td>
                    <td className={numericTone(metrics.net)}>
                      {money(metrics.net)}
                    </td>
                    <td>{money(metrics.totalR)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>{t.noTrades}</p>
        )}
      </Panel>
      <RiskAnalysis trades={trades} />
      <PeriodBreakdown trades={trades} />
      <EvidenceStatistics trades={trades} />
    </>
  );
}
