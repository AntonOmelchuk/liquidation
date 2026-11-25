import { TRASH_KIND } from "@liquidation/domain/journal/trash/constants";
import { PLAN_NARRATIVES } from "@liquidation/domain/plans/constants";
import { getPlanVoiding } from "@liquidation/domain/plans/plan-lifecycle";
import {
  PERIOD,
  WATCH_OUTCOMES,
  WORKSPACE_TEXT_LIMIT,
} from "@liquidation/domain/workspace/constants";
import {
  calendarDate,
  periodBounds,
} from "@liquidation/domain/workspace/period";
import { ScreenshotField } from "../../../shared/screenshots/screenshot-field.tsx";
import { InstrumentIcons } from "../../../shared/ui/instrument-picker.tsx";
import { SelectField } from "../../../shared/ui/select-field.tsx";
import { NEW_PLAN_HREF } from "../../../app/constants.ts";
import { useState } from "react";
import { useLocale } from "../../../shared/messages.ts";
import { useJournal } from "../../journal/data/store.ts";
import { usePlanMessages } from "../../plans/messages.ts";
import { useTrashMessages } from "../../trash/messages.ts";
import { useWorkspaceMessages } from "../messages.ts";
import { usePlanningMessages } from "./messages.ts";
import type { WatchItemEditorProps } from "./types.ts";

export function WatchItemEditor({
  week,
  item,
  onChange,
  onRemove,
  disabled,
}: WatchItemEditorProps) {
  const p = usePlanMessages();
  const m = usePlanningMessages();
  const w = useWorkspaceMessages();
  const d = useTrashMessages();
  const plans = useJournal((state) => state.plans);
  const trash = useJournal((state) => state.trash);
  const refresh = useJournal((state) => state.refreshJournal);
  const { t, format } = useLocale();
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const { start, through } = periodBounds(PERIOD.WEEK, week);
  const options = [
    ...plans
      .filter((plan) => {
        const { symbol, startsOn, endsOn } = plan.setup;
        return (
          item.planIds.includes(plan.id) ||
          (symbol === item.symbol &&
            !getPlanVoiding(plan) &&
            (!startsOn ||
              (startsOn <= through && (endsOn ?? startsOn) >= start)))
        );
      })
      .map(({ id, setup }) => ({
        id,
        title: setup.startsOn
          ? `${setup.title} · ${format.day.formatRange(calendarDate(setup.startsOn), calendarDate(setup.endsOn ?? setup.startsOn))}`
          : setup.title,
      })),
    ...trash.flatMap((entry) =>
      entry.kind === TRASH_KIND.PLAN && item.planIds.includes(entry.value.id)
        ? [
            {
              id: entry.value.id,
              title: entry.value.setup.title + " · " + d.deleted,
            },
          ]
        : [],
    ),
  ];
  return (
    <section className="watch-asset">
      <div className="panel-heading">
        <h3 className="instrument-label">
          <InstrumentIcons symbol={item.symbol} />
          {item.symbol}
        </h3>
        <button
          type="button"
          className="secondary"
          disabled={disabled}
          onClick={onRemove}
        >
          {w.remove}
        </button>
      </div>
      <SelectField
        label={p.narrative}
        value={item.narrative}
        onChange={(event) => {
          const narrative = PLAN_NARRATIVES.find(
            (key) => key === event.target.value,
          );
          if (narrative) onChange({ ...item, narrative });
        }}
      >
        {PLAN_NARRATIVES.map((value) => (
          <option key={value} value={value}>
            {p[value]}
          </option>
        ))}
      </SelectField>
      <label>
        {m.assetNotes}
        <textarea
          rows={4}
          value={item.notes}
          maxLength={WORKSPACE_TEXT_LIMIT}
          onChange={(event) => onChange({ ...item, notes: event.target.value })}
        />
      </label>
      <ScreenshotField
        value={item.images}
        disabled={disabled}
        onChange={(images) => onChange({ ...item, images })}
      />
      <details className="watch-plan-options" open={item.planIds.length > 0}>
        <summary>
          {m.linkedPlans} · {item.planIds.length}
        </summary>
        {options.length ? (
          options.map(({ id, title }) => (
            <label key={id} className="workspace-check">
              <input
                type="checkbox"
                checked={item.planIds.includes(id)}
                onChange={(event) =>
                  onChange({
                    ...item,
                    planIds: event.target.checked
                      ? [...item.planIds, id]
                      : item.planIds.filter((value) => value !== id),
                  })
                }
              />{" "}
              {title}
            </label>
          ))
        ) : (
          <p>{m.noPlans}</p>
        )}
        <div className="workspace-actions">
          <a
            className="record-link"
            href={NEW_PLAN_HREF}
            target="_blank"
            rel="noopener"
          >
            {p.create}
          </a>
          <button
            type="button"
            className="secondary"
            disabled={refreshing}
            onClick={async () => {
              setRefreshing(true);
              setFailed(false);
              try {
                await refresh();
              } catch {
                setFailed(true);
              } finally {
                setRefreshing(false);
              }
            }}
          >
            {m.refreshPlans}
          </button>
        </div>
        {failed && (
          <p role="alert" className="error">
            {t.loadError}
          </p>
        )}
      </details>
      <div className="watch-asset-review record-field-grid">
        <SelectField
          label={m.outcome}
          value={item.outcome}
          onChange={(event) => {
            const outcome = WATCH_OUTCOMES.find(
              (value) => value === event.target.value,
            );
            if (outcome) onChange({ ...item, outcome });
          }}
        >
          {WATCH_OUTCOMES.map((value) => (
            <option key={value} value={value}>
              {m[value]}
            </option>
          ))}
        </SelectField>
        <label className="wide">
          {m.assetReview}
          <textarea
            rows={3}
            value={item.review}
            maxLength={WORKSPACE_TEXT_LIMIT}
            onChange={(event) =>
              onChange({ ...item, review: event.target.value })
            }
          />
        </label>
      </div>
    </section>
  );
}
