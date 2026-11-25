import {
  MISTAKE_PRESET,
  TRADE_TAG_LIMITS,
} from "@liquidation/domain/trades/constants";
import { tradeTagKey } from "@liquidation/domain/trades/trade-tags";
import type { MistakeReviewFieldsProps } from "./types.ts";
import { ADD_MISTAKE_KEY } from "./constants.ts";
import { useState } from "react";
import { useLocale } from "../../shared/messages.ts";
import { Panel } from "../../shared/ui/layout.tsx";
import { useJournal } from "../journal/data/store.ts";
import { mistakeLabel, useMistakeMessages } from "./messages.ts";

export function MistakeReviewFields({
  initial,
  disabled = false,
}: MistakeReviewFieldsProps) {
  const m = useMistakeMessages();
  const { language } = useLocale();
  const trades = useJournal((state) => state.trades);
  const positions = useJournal((state) => state.positions);
  const [selected, setSelected] = useState(
    () =>
      new Map(
        (initial?.mistakes ?? []).map((label) => [tradeTagKey(label), label]),
      ),
  );
  const [critical, setCritical] = useState(
    () => new Set((initial?.criticalMistakes ?? []).map(tradeTagKey)),
  );
  const [reviewed, setReviewed] = useState(
    Boolean(initial?.mistakesReviewed || initial?.mistakes?.length),
  );
  const [custom, setCustom] = useState("");
  const options = new Map<string, string>();
  for (const label of [
    ...Object.values(MISTAKE_PRESET),
    ...(trades ?? []).flatMap((trade) => trade.mistakes ?? []),
    ...positions.flatMap((position) => position.mistakes ?? []),
    ...selected.values(),
  ]) {
    const key = tradeTagKey(label);
    if (!options.has(key)) options.set(key, label);
  }
  const full = selected.size >= TRADE_TAG_LIMITS.mistakes;

  function toggle(label: string, checked: boolean) {
    const key = tradeTagKey(label);
    if (checked && full && !selected.has(key)) return;
    setSelected((prior) => {
      const next = new Map(prior);
      if (checked) next.set(key, label);
      else next.delete(key);
      return next;
    });
    if (checked) setReviewed(true);
    else
      setCritical((prior) => {
        const next = new Set(prior);
        next.delete(key);
        return next;
      });
  }

  function addCustom() {
    const label = custom.trim();
    if (!label || disabled || full) return;
    toggle(options.get(tradeTagKey(label)) ?? label, true);
    setCustom("");
  }

  return (
    <Panel
      title={m.review}
      detail={
        <span>
          {selected.size}/{TRADE_TAG_LIMITS.mistakes}
        </span>
      }
    >
      <p className="analytics-hint">{m.reviewHint}</p>
      <fieldset className="mistake-review-fields" disabled={disabled}>
        <label className="workspace-check wide">
          <input
            type="checkbox"
            name="mistakesReviewed"
            checked={reviewed || selected.size > 0}
            disabled={selected.size > 0}
            onChange={(event) => setReviewed(event.currentTarget.checked)}
          />
          {m.reviewed}
        </label>
        <div className="mistake-options wide">
          {[...options].map(([key, label]) => (
            <div
              className="mistake-option"
              key={key}
              data-selected={selected.has(key) || undefined}
            >
              <label className="workspace-check">
                <input
                  type="checkbox"
                  name="mistakes"
                  value={selected.get(key) ?? label}
                  checked={selected.has(key)}
                  disabled={full && !selected.has(key)}
                  onChange={(event) =>
                    toggle(label, event.currentTarget.checked)
                  }
                />
                {mistakeLabel(label, language)}
              </label>
              {selected.has(key) && (
                <label className="workspace-check mistake-critical">
                  <input
                    type="checkbox"
                    name="criticalMistakes"
                    value={selected.get(key) ?? label}
                    checked={critical.has(key)}
                    onChange={(event) => {
                      const checked = event.currentTarget.checked;
                      setCritical((prior) => {
                        const next = new Set(prior);
                        if (checked) next.add(key);
                        else next.delete(key);
                        return next;
                      });
                    }}
                  />
                  {m.critical}
                </label>
              )}
            </div>
          ))}
        </div>
        <div className="mistake-custom wide">
          <label>
            {m.custom}
            <input
              maxLength={TRADE_TAG_LIMITS.mistake}
              value={custom}
              disabled={full}
              onChange={(event) => setCustom(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === ADD_MISTAKE_KEY) {
                  event.preventDefault();
                  addCustom();
                }
              }}
            />
          </label>
          <button
            type="button"
            className="secondary"
            disabled={full || !custom.trim()}
            onClick={addCustom}
          >
            {m.add}
          </button>
        </div>
        {full && <p className="analytics-hint wide">{m.limit}</p>}
        <label className="wide">
          {m.reviewNotes}
          <textarea
            name="reviewNotes"
            rows={4}
            maxLength={4000}
            defaultValue={initial?.reviewNotes}
            placeholder={m.notesPlaceholder}
          />
        </label>
      </fieldset>
    </Panel>
  );
}
