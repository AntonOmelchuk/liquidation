import {
  estimatedMissedCents,
  executedPlanIds,
} from "@liquidation/domain/analytics/plan-performance";
import { TRASH_KIND } from "@liquidation/domain/journal/trash/constants";
import { deletedPlan } from "@liquidation/domain/journal/trash/trash";
import { localDay } from "@liquidation/domain/workspace/period";
import { isBreakevenReviewReason } from "@liquidation/domain/workspace/planning";
import { useMemo, useState } from "react";
import { planHref } from "../../../app/page.ts";
import { EMPTY_VALUE } from "../../../shared/constants.ts";
import { numericTone } from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import { ScreenshotGallery } from "../../../shared/screenshots/screenshot-gallery.tsx";
import { Panel } from "../../../shared/ui/layout.tsx";
import { InstrumentIcons } from "../../../shared/ui/instrument-picker.tsx";
import { useJournal } from "../../journal/data/store.ts";
import { DeleteRecord } from "../../trash/delete-record.tsx";
import { useTrashMessages } from "../../trash/messages.ts";
import { useWorkspaceMessages } from "../messages.ts";
import { BreakevenReviewSummary } from "./breakeven-review-summary.tsx";
import { MISSED_TRADES_PANEL_ID } from "./constants.ts";
import { usePlanningMessages } from "./messages.ts";
import { MissedEditor } from "./missed-editor.tsx";
import type { MissedTradesPanelProps } from "./types.ts";
import "./planning.css";

export function MissedTradesShortcut({ disabled }: { disabled?: boolean }) {
  const m = usePlanningMessages();
  return (
    <button
      type="button"
      className="secondary"
      disabled={disabled}
      onClick={() =>
        document
          .getElementById(MISSED_TRADES_PANEL_ID)
          ?.scrollIntoView({ block: "start" })
      }
    >
      {m.missedTrades}
    </button>
  );
}

export function MissedTradesPanel({
  from,
  through,
  initialDay,
}: MissedTradesPanelProps) {
  const { t, format } = useLocale();
  const m = usePlanningMessages();
  const w = useWorkspaceMessages();
  const d = useTrashMessages();
  const misses = useJournal((state) => state.workspace.missedTrades);
  const trades = useJournal((state) => state.trades);
  const positions = useJournal((state) => state.positions);
  const plans = useJournal((state) => state.plans);
  const trash = useJournal((state) => state.trash);
  const [draft, setDraft] = useState<{ id?: string }>();
  const linked = useMemo(
    () => executedPlanIds({ trades: trades ?? [], positions }),
    [trades, positions],
  );
  const visible = useMemo(
    () =>
      misses
        .filter(({ missedAt }) => {
          const day = localDay(missedAt);
          return (!from || day >= from) && (!through || day <= through);
        })
        .toSorted((a, b) => Date.parse(b.missedAt) - Date.parse(a.missedAt)),
    [misses, from, through],
  );
  const editing = misses.find(({ id }) => id === draft?.id);
  const opportunities = visible.filter(
    ({ reason }) => !isBreakevenReviewReason(reason),
  );
  const assessed = opportunities.filter(
    ({ planId, outcome }) => outcome && (!planId || !linked.has(planId)),
  );
  const total = assessed.reduce((sum, { outcome }) => sum + outcome!.netR, 0);
  const monetary = assessed.flatMap(({ outcome }) => {
    const cents = estimatedMissedCents(outcome!);
    return cents === null ? [] : [cents];
  });
  const cash = monetary.reduce((sum, cents) => sum + cents, 0);
  return (
    <Panel
      id={MISSED_TRADES_PANEL_ID}
      title={m.missedTrades}
      detail={
        <button
          className="secondary"
          type="button"
          disabled={Boolean(draft)}
          onClick={() => setDraft({})}
        >
          ＋ {m.newMissed}
        </button>
      }
    >
      {draft && (
        <MissedEditor
          key={draft.id ?? "new"}
          entry={editing}
          initialDay={initialDay}
          onClose={() => setDraft(undefined)}
        />
      )}
      {visible.length ? (
        <>
          {opportunities.length > 0 && (
            <section className="metrics" aria-label={m.fromJournal}>
              <article>
                <span>{m.fromJournal}</span>
                <strong>{format.integer.format(opportunities.length)}</strong>
              </article>
              <article>
                <span>{m.netR}</span>
                <strong className={numericTone(total)}>
                  {assessed.length
                    ? format.money.format(total) + " R"
                    : EMPTY_VALUE}
                </strong>
              </article>
              <article>
                <span>{m.estimatedPnl}</span>
                <strong className={numericTone(cash)}>
                  {monetary.length
                    ? format.money.format(cash / 100)
                    : EMPTY_VALUE}
                </strong>
                {monetary.length < assessed.length && (
                  <small>
                    {m.missingRisk} · {assessed.length - monetary.length}
                  </small>
                )}
              </article>
            </section>
          )}
          <BreakevenReviewSummary records={visible} />
          <div className="table">
            <table aria-label={m.missedTrades}>
              <thead>
                <tr>
                  <th scope="col">{t.symbol}</th>
                  <th scope="col">{m.missedEventAt}</th>
                  <th scope="col">{m.reason}</th>
                  <th scope="col">{m.netRColumn}</th>
                  <th scope="col">{m.estimatedCashColumn}</th>
                  <th scope="col">{t.notes}</th>
                  <th scope="col" />
                </tr>
              </thead>
              <tbody>
                {visible.map((miss) => {
                  const beReview = isBreakevenReviewReason(miss.reason);
                  const sign = beReview ? -1 : 1;
                  const excluded = Boolean(
                    !beReview && miss.planId && linked.has(miss.planId),
                  );
                  const plan = plans.find(({ id }) => id === miss.planId);
                  const old = deletedPlan(trash, miss.planId);
                  const cents = miss.outcome
                    ? estimatedMissedCents(miss.outcome)
                    : null;
                  return (
                    <tr key={miss.id}>
                      <th scope="row">
                        <span className="instrument-label">
                          <InstrumentIcons symbol={miss.symbol} />
                          {miss.symbol}
                        </span>
                        <small>{t[miss.direction]}</small>
                        {plan ? (
                          <a className="record-link" href={planHref(plan.id)}>
                            {plan.setup.title}
                          </a>
                        ) : (
                          old && (
                            <small>
                              {old.setup.title} · {d.deleted}
                            </small>
                          )
                        )}
                      </th>
                      <td>{format.date.format(Date.parse(miss.missedAt))}</td>
                      <td>{m[miss.reason]}</td>
                      <td>
                        {miss.outcome
                          ? format.money.format(sign * miss.outcome.netR) + " R"
                          : m.pendingOutcome}
                      </td>
                      <td>
                        {cents === null
                          ? EMPTY_VALUE
                          : format.money.format((sign * cents) / 100)}
                        {excluded && <small>{m.excludeExecuted}</small>}
                      </td>
                      <td>
                        <p className="record-prose">{miss.notes}</p>
                        <ScreenshotGallery ids={miss.screenshotIds} />
                      </td>
                      <td>
                        <div className="missed-trade-actions">
                          <button
                            className="secondary"
                            type="button"
                            disabled={Boolean(draft)}
                            onClick={() => setDraft({ id: miss.id })}
                          >
                            {w.edit}
                          </button>
                          <DeleteRecord
                            kind={TRASH_KIND.MISSED}
                            recordKey={miss.id}
                            revision={miss.revision}
                            disabled={Boolean(draft)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p>{m.noMisses}</p>
      )}
    </Panel>
  );
}
