import { sampleResult } from "@liquidation/domain/backtests/backtest";
import type { Backtest } from "@liquidation/domain/backtests/types";
import { backtestSampleHref } from "../../app/page.ts";
import { EMPTY_VALUE } from "../../shared/constants.ts";
import { numericTone } from "../../shared/format.ts";
import { useLocale } from "../../shared/messages.ts";
import { ICON_ACTION } from "../../shared/ui/constants.ts";
import { DateText } from "../../shared/ui/date-text.tsx";
import { TradeSideBadge } from "../../shared/ui/direction-badge.tsx";
import { IconAction } from "../../shared/ui/icon-action.tsx";
import { InstrumentLabel } from "../../shared/ui/instrument-label.tsx";
import {
  RecordTable,
  TableActions,
  TableExcerpt,
} from "../../shared/ui/record-table.tsx";
import { useBacktestMessages } from "./messages.ts";

export function BacktestSamplesTable({ run }: { run: Backtest }) {
  const { t, format } = useLocale();
  const b = useBacktestMessages();
  return (
    <RecordTable label={b.samples}>
      <thead>
        <tr>
          <th scope="col">{t.symbol}</th>
          <th scope="col">{t.side}</th>
          <th scope="col">{t.timeframe}</th>
          <th scope="col">{t.opened}</th>
          <th scope="col">{t.closed}</th>
          <th scope="col">{t.result}</th>
          <th scope="col">{t.notes}</th>
          <th scope="col" className="record-table-actions" />
        </tr>
      </thead>
      <tbody>
        {run.samples
          .toSorted((a, b) => b.openedAt.localeCompare(a.openedAt))
          .map((sample) => {
            const r = sampleResult(sample);
            return (
              <tr key={sample.id}>
                <th scope="row">
                  <a
                    className="record-link"
                    href={backtestSampleHref(run.id, sample.id)}
                  >
                    <InstrumentLabel symbol={sample.symbol} />
                  </a>
                </th>
                <td>
                  <TradeSideBadge side={sample.direction} />
                </td>
                <td>{sample.timeframe || EMPTY_VALUE}</td>
                <td>
                  <DateText value={sample.openedAt} withTime />
                </td>
                <td>
                  <DateText value={sample.closedAt} withTime />
                </td>
                <td className={numericTone(r)}>
                  <strong>{format.money.format(r)} R</strong>
                </td>
                <td>
                  <TableExcerpt text={sample.notes} />
                </td>
                <TableActions>
                  <IconAction
                    icon={ICON_ACTION.EDIT}
                    label={b.editSample}
                    href={backtestSampleHref(run.id, sample.id, true)}
                  />
                </TableActions>
              </tr>
            );
          })}
      </tbody>
    </RecordTable>
  );
}
