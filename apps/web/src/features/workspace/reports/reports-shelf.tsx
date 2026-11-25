import { reportIndex } from "@liquidation/domain/workspace/report-index";
import { PERIOD } from "@liquidation/domain/workspace/constants";
import { calendarDate, localDay } from "@liquidation/domain/workspace/period";
import { reportHref } from "../../../app/page.ts";
import { EMPTY_VALUE, LOCALES } from "../../../shared/constants.ts";
import { numericTone } from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import { Panel } from "../../../shared/ui/layout.tsx";
import { useJournal } from "../../journal/data/store.ts";
import { useReportIndexMessages } from "./index-messages.ts";
import type { ReportIndexRowProps } from "./types.ts";
import "./reports-index.css";

function ReportIndexRow({ row }: ReportIndexRowProps) {
  const { format, language } = useLocale();
  const c = useReportIndexMessages();
  const { metrics, coverage, report } = row;
  const title =
    row.kind === PERIOD.QUARTER
      ? "Q" +
        (Math.floor(calendarDate(row.start).getUTCMonth() / 3) + 1) +
        " · " +
        row.start.slice(0, 4)
      : new Intl.DateTimeFormat(LOCALES[language], {
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        }).format(calendarDate(row.start));
  const money = (value: number | null) =>
    value === null ? EMPTY_VALUE : format.money.format(value);
  return (
    <tr
      className={row.kind === PERIOD.QUARTER ? "report-quarter-row" : undefined}
    >
      <th scope="row">
        <a className="record-link" href={reportHref(row.kind, row.start)}>
          {title}
        </a>
      </th>
      <td>{metrics.count}</td>
      <td>
        {metrics.winRate === null
          ? EMPTY_VALUE
          : format.percentage.format(metrics.winRate)}
      </td>
      <td className={numericTone(metrics.net)}>{money(metrics.net)}</td>
      <td>{money(metrics.totalR)}</td>
      <td>{money(metrics.expectancyR)}</td>
      <td>{money(metrics.maxDrawdown)}</td>
      <td>
        {coverage.reviewedDays}/{coverage.tradingDays}
      </td>
      <td>
        <a className="record-link" href={reportHref(row.kind, row.start)}>
          {report
            ? report.overview || report.next || report.lesson
              ? c.conclusions
              : c.written
            : c.build}
        </a>
      </td>
    </tr>
  );
}

export function ReportsShelf() {
  const { t } = useLocale();
  const c = useReportIndexMessages();
  const { trades, positions, workspace } = useJournal();
  const groups = reportIndex(
    { trades: trades ?? [], positions, reports: workspace.reports },
    localDay(new Date().toISOString()),
  );
  return (
    <Panel title={c.reportHistory}>
      <div className="table compact-record-table">
        <table aria-label={c.reportHistory}>
          <thead>
            <tr>
              <th>{t.fromDate}</th>
              <th>{t.count}</th>
              <th>WR</th>
              <th>{t.pnl}</th>
              <th>Σ R</th>
              <th>EV (R)</th>
              <th>Max DD</th>
              <th>{c.coverage}</th>
              <th>{t.notes}</th>
            </tr>
          </thead>
          {groups.map((group) => (
            <tbody key={group.quarter.start}>
              <ReportIndexRow row={group.quarter} />
              {group.months.map((row) => (
                <ReportIndexRow key={row.start} row={row} />
              ))}
            </tbody>
          ))}
        </table>
      </div>
      <p className="analytics-hint">{c.coverageHint}</p>
    </Panel>
  );
}
