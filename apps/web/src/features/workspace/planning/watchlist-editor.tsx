import { instrumentSymbolSchema } from "@liquidation/domain/instruments/symbol";
import { PLAN_NARRATIVE } from "@liquidation/domain/plans/constants";
import {
  WATCHLIST_LIMIT,
  WATCH_OUTCOME,
  WORKSPACE_RECORD,
  WORKSPACE_TEXT_LIMIT,
} from "@liquidation/domain/workspace/constants";
import { useState } from "react";
import type { FormEvent } from "react";
import { useLocale } from "../../../shared/messages.ts";
import {
  collectScreenshots,
  existingScreenshots,
} from "../../../shared/screenshots/draft.ts";
import { InstrumentPicker } from "../../../shared/ui/instrument-picker.tsx";
import { formText } from "../form.ts";
import { useWorkspaceSave } from "../use-workspace-save.ts";
import {
  WorkspaceFeedback,
  WorkspaceSaveButton,
} from "../workspace-feedback.tsx";
import { usePlanningMessages } from "./messages.ts";
import { WatchItemEditor } from "./watch-item-editor.tsx";
import type { WatchDraft, WatchlistEditorProps } from "./types.ts";

export function WatchlistEditor({
  week,
  entry,
  onClose,
}: WatchlistEditorProps) {
  const { t } = useLocale();
  const m = usePlanningMessages();
  const [symbol, setSymbol] = useState("");
  const [revision] = useState(entry?.revision);
  const [items, setItems] = useState<WatchDraft[]>(() =>
    (entry?.items ?? []).map(({ screenshotIds, ...item }) => ({
      ...item,
      images: existingScreenshots(screenshotIds),
    })),
  );
  const { save, status, saving } = useWorkspaceSave();
  const candidate = instrumentSymbolSchema.safeParse(symbol);
  const canAdd =
    candidate.success &&
    items.length < WATCHLIST_LIMIT &&
    !items.some((item) => item.symbol === candidate.data);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = {
      outlook: formText(form, "outlook"),
      review: formText(form, "review"),
      items: items.map(({ images, ...item }) => ({
        ...item,
        screenshotIds: images.map(({ id }) => id),
      })),
    };
    if (
      await save(
        { record: WORKSPACE_RECORD.WATCHLIST, start: week, revision, input },
        collectScreenshots(items.map(({ images }) => images)),
      )
    )
      onClose();
  }
  return (
    <form className="layout" onSubmit={(event) => void submit(event)}>
      <fieldset className="planning-fields" disabled={saving}>
        <label>
          {m.weekOutlook}
          <textarea
            name="outlook"
            rows={5}
            maxLength={WORKSPACE_TEXT_LIMIT}
            defaultValue={entry?.outlook}
          />
        </label>
        <div className="journal-filters">
          <InstrumentPicker
            value={symbol}
            onChange={setSymbol}
            required={false}
          />
          <button
            type="button"
            className="secondary"
            disabled={!canAdd}
            onClick={() => {
              if (!canAdd) return;
              setItems((current) => [
                ...current,
                {
                  symbol: candidate.data,
                  narrative: PLAN_NARRATIVE.NEUTRAL,
                  notes: "",
                  planIds: [],
                  outcome: WATCH_OUTCOME.PENDING,
                  review: "",
                  images: [],
                },
              ]);
              setSymbol("");
            }}
          >
            ＋ {m.addAsset}
          </button>
        </div>
        <div className="watch-assets">
          {items.map((item) => (
            <WatchItemEditor
              key={item.symbol}
              week={week}
              item={item}
              disabled={saving}
              onChange={(next) =>
                setItems((current) =>
                  current.map((previous) =>
                    previous.symbol === next.symbol ? next : previous,
                  ),
                )
              }
              onRemove={() =>
                setItems((current) =>
                  current.filter(({ symbol }) => symbol !== item.symbol),
                )
              }
            />
          ))}
        </div>
        <label>
          {m.weekReview}
          <textarea
            name="review"
            rows={5}
            maxLength={WORKSPACE_TEXT_LIMIT}
            defaultValue={entry?.review}
          />
        </label>
      </fieldset>
      <WorkspaceFeedback status={status} />
      <div className="workspace-actions">
        <WorkspaceSaveButton saving={saving} />
        <button
          className="secondary"
          type="button"
          disabled={saving}
          onClick={onClose}
        >
          {t.cancel}
        </button>
      </div>
    </form>
  );
}
