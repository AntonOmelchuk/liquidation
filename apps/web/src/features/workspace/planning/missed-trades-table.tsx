import { missedTradeEstimate } from "@liquidation/domain/analytics/plan-performance";
import { TRASH_KIND } from "@liquidation/domain/journal/trash/constants";
import { deletedPlan } from "@liquidation/domain/journal/trash/trash";
import { MISSED_REASON } from "@liquidation/domain/workspace/constants";
import { isBreakevenReviewReason } from "@liquidation/domain/workspace/planning";
import { missedTradeHref } from "../../../app/page.ts";
import { EMPTY_VALUE } from "../../../shared/constants.ts";
import { numericTone } from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import { ICON_ACTION } from "../../../shared/ui/constants.ts";
import { DateText } from "../../../shared/ui/date-text.tsx";
import { TradeSideBadge } from "../../../shared/ui/direction-badge.tsx";
import { IconAction } from "../../../shared/ui/icon-action.tsx";
import { InstrumentLabel } from "../../../shared/ui/instrument-label.tsx";
import {
  RecordTable,
  TableActions,
  TableExcerpt,
} from "../../../shared/ui/record-table.tsx";
import { useJournal } from "../../journal/data/store.ts";
import { DeleteRecord } from "../../trash/delete-record.tsx";
import { useWorkspaceMessages } from "../messages.ts";
import { usePlanningMessages } from "./messages.ts";
import type { MissedTradesTableProps } from "./types.ts";

export function MissedTradesTable({
  records,
  executed,
}: MissedTradesTableProps) {
  const { t, format } = useLocale();
  const m = usePlanningMessages();
  const w = useWorkspaceMessages();
  const plans = useJournal((state) => state.plans);
  const trash = useJournal((state) => state.trash);
  return (
    <RecordTable label={m.missedTrades}>
      <thead>
        <tr>
          <th scope="col">{t.symbol}</th>
          <th scope="col">{t.side}</th>
          <th scope="col">{m.missedEventAt}</th>
          <th scope="col">{m.reason}</th>
          <th scope="col">{m.netRColumn}</th>
          <th scope="col">{m.estimatedCashColumn}</th>
          <th scope="col">{t.linkedPlan}</th>
          <th scope="col">{t.notes}</th>
          <th scope="col" className="record-table-actions" />
        </tr>
      </thead>
      <tbody>
        {records.map((miss) => {
          const be = isBreakevenReviewReason(miss.reason);
          const excluded = !be && miss.planId && executed.has(miss.planId);
          const { netR: result, cash } = missedTradeEstimate(miss);
          const plan =
            plans.find(({ id }) => id === miss.planId) ??
            deletedPlan(trash, miss.planId);
          const tone =
            miss.reason === MISSED_REASON.BE_SAVED_STOP
              ? "positive"
              : be
                ? "negative"
                : "attention";
          return (
            <tr key={miss.id}>
              <th scope="row">
                <a className="record-link" href={missedTradeHref(miss.id)}>
                  <InstrumentLabel symbol={miss.symbol} />
                </a>
              </th>
              <td>
                <TradeSideBadge side={miss.direction} />
              </td>
              <td>
                <DateText value={miss.missedAt} withTime />
              </td>
              <td>
                <span className={`record-tag ${tone}`}>{m[miss.reason]}</span>
              </td>
              <td className={numericTone(result ?? 0)}>
                {result === null
                  ? EMPTY_VALUE
                  : format.money.format(result) + " R"}
              </td>
              <td
                className={numericTone(cash ?? 0)}
                title={excluded ? m.excludeExecuted : undefined}
              >
                {cash === null ? EMPTY_VALUE : format.money.format(cash)}
              </td>
              <td>
                <TableExcerpt text={plan?.setup.title} />
              </td>
              <td>
                <TableExcerpt text={miss.notes} />
              </td>
              <TableActions>
                <IconAction
                  icon={ICON_ACTION.EDIT}
                  label={w.edit}
                  href={missedTradeHref(miss.id, true)}
                />
                <DeleteRecord
                  kind={TRASH_KIND.MISSED}
                  recordKey={miss.id}
                  revision={miss.revision}
                />
              </TableActions>
            </tr>
          );
        })}
      </tbody>
    </RecordTable>
  );
}
