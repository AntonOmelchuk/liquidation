import { missedTradeEstimate } from "@liquidation/domain/analytics/plan-performance";
import { TRASH_KIND } from "@liquidation/domain/journal/trash/constants";
import { deletedPlan } from "@liquidation/domain/journal/trash/trash";
import { PAGE, PAGE_HASHES, PAGE_VIEW } from "../../../app/constants.ts";
import { missedTradeHref, planHref } from "../../../app/page.ts";
import type { Route } from "../../../app/types.ts";
import { EMPTY_VALUE } from "../../../shared/constants.ts";
import { numericTone } from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import { ScreenshotGallery } from "../../../shared/screenshots/screenshot-gallery.tsx";
import { ICON_ACTION } from "../../../shared/ui/constants.ts";
import { DateText } from "../../../shared/ui/date-text.tsx";
import { TradeSideBadge } from "../../../shared/ui/direction-badge.tsx";
import { IconAction } from "../../../shared/ui/icon-action.tsx";
import { InstrumentLabel } from "../../../shared/ui/instrument-label.tsx";
import { Panel, RecordHeading } from "../../../shared/ui/layout.tsx";
import { MetricCard, MetricGrid } from "../../../shared/ui/metric-card.tsx";
import { JOURNAL_STATUS } from "../../journal/data/constants.ts";
import { useJournal } from "../../journal/data/store.ts";
import { JournalUnavailable } from "../../journal/journal-unavailable.tsx";
import { DeleteRecord } from "../../trash/delete-record.tsx";
import { useTrashMessages } from "../../trash/messages.ts";
import { useWorkspaceMessages } from "../messages.ts";
import { usePlanningMessages } from "./messages.ts";
import { MissedEditor } from "./missed-editor.tsx";
import { MissedTradesPanel } from "./missed-trades-panel.tsx";

const listHref = PAGE_HASHES[PAGE.MISSED_TRADES];

export default function MissedTradesPage(
  route: Extract<Route, { page: typeof PAGE.MISSED_TRADES }>,
) {
  const { t, format } = useLocale();
  const m = usePlanningMessages();
  const w = useWorkspaceMessages();
  const d = useTrashMessages();
  const id = "id" in route ? route.id : undefined;
  const status = useJournal((state) => state.status);
  const entry = useJournal((state) =>
    state.workspace.missedTrades.find((record) => record.id === id),
  );
  const plan = useJournal((state) =>
    state.plans.find((item) => item.id === entry?.planId),
  );
  const oldPlan = useJournal((state) =>
    deletedPlan(state.trash, entry?.planId),
  );
  if (status !== JOURNAL_STATUS.READY || (id && !entry))
    return (
      <JournalUnavailable
        backHref={listHref}
        backLabel={m.allMissed}
        missing={m.missedMissing}
      />
    );
  if (route.view === PAGE_VIEW.LIST)
    return (
      <main>
        <RecordHeading
          title={m.missedAnalytics}
          backHref={PAGE_HASHES.journal}
          backLabel={t.backJournal}
        />
        <MissedTradesPanel showBreakdown />
      </main>
    );
  if (route.view === PAGE_VIEW.EDIT || route.view === PAGE_VIEW.NEW) {
    const back = entry ? missedTradeHref(entry.id) : listHref;
    return (
      <main>
        <RecordHeading
          title={entry ? w.edit + " · " + entry.symbol : m.newMissed}
          backHref={back}
          backLabel={entry ? m.missedDetail : m.allMissed}
        />
        <Panel title={m.missedDetail}>
          <MissedEditor
            entry={entry}
            initialDay={"day" in route ? route.day : undefined}
            onClose={(savedId) => {
              window.location.hash = savedId ? missedTradeHref(savedId) : back;
            }}
          />
        </Panel>
      </main>
    );
  }
  if (!entry) return null;
  const { netR: result, cash } = missedTradeEstimate(entry);
  return (
    <main className="layout">
      <RecordHeading
        title={<InstrumentLabel symbol={entry.symbol} />}
        backHref={listHref}
        backLabel={m.allMissed}
        meta={
          <>
            <TradeSideBadge side={entry.direction} />
            <DateText value={entry.missedAt} withTime />
          </>
        }
        actions={
          <>
            <IconAction
              icon={ICON_ACTION.EDIT}
              label={w.edit}
              href={missedTradeHref(entry.id, true)}
            />
            <DeleteRecord
              kind={TRASH_KIND.MISSED}
              recordKey={entry.id}
              revision={entry.revision}
              afterDelete={() => {
                window.location.hash = listHref;
              }}
            />
          </>
        }
      />
      <MetricGrid compact>
        <MetricCard label={m.reason} value={m[entry.reason]} icon="TARGET" />
        <MetricCard
          label={m.netRColumn}
          value={
            result === null ? EMPTY_VALUE : format.money.format(result) + " R"
          }
          icon="TREND"
          tone={numericTone(result ?? 0)}
          detail={
            entry.outcome && (
              <DateText value={entry.outcome.closedAt} withTime />
            )
          }
        />
        <MetricCard
          label={m.estimatedCashColumn}
          value={cash === null ? EMPTY_VALUE : format.money.format(cash)}
          icon="WALLET"
          tone={numericTone(cash ?? 0)}
        />
      </MetricGrid>
      {(plan || oldPlan) && (
        <Panel title={t.linkedPlan}>
          {plan ? (
            <a className="record-link" href={planHref(plan.id)}>
              {plan.setup.title}
            </a>
          ) : (
            <p>
              {oldPlan?.setup.title} · {d.deleted}
            </p>
          )}
        </Panel>
      )}
      <Panel title={t.notes}>
        <p className="record-prose">{entry.notes || EMPTY_VALUE}</p>
        <ScreenshotGallery ids={entry.screenshotIds} />
      </Panel>
    </main>
  );
}
