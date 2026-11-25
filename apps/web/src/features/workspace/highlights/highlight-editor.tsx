import {
  WORKSPACE_RECORD,
  WORKSPACE_TEXT_LIMIT,
  WORKSPACE_TITLE_LIMIT,
} from "@liquidation/domain/workspace/constants";
import { useState } from "react";
import type { FormEvent } from "react";
import { useLocale } from "../../../shared/messages.ts";
import {
  collectScreenshots,
  existingScreenshots,
} from "../../../shared/screenshots/draft.ts";
import { ScreenshotField } from "../../../shared/screenshots/screenshot-field.tsx";
import { Panel } from "../../../shared/ui/layout.tsx";
import { formText } from "../form.ts";
import { useWorkspaceMessages } from "../messages.ts";
import { useWorkspaceSave } from "../use-workspace-save.ts";
import {
  WorkspaceFeedback,
  WorkspaceSaveButton,
} from "../workspace-feedback.tsx";
import type { HighlightEditorProps } from "./types.ts";

export function HighlightEditor({
  trade,
  entry,
  onClose,
}: HighlightEditorProps) {
  const { t, format } = useLocale();
  const m = useWorkspaceMessages();
  const [id] = useState(() => trade?.id ?? entry?.id ?? crypto.randomUUID());
  const [revision] = useState(entry?.revision);
  const [images, setImages] = useState(() =>
    existingScreenshots(entry?.screenshotIds),
  );
  const { status, saving, save } = useWorkspaceSave();
  const standalone = entry ? Boolean(entry.example) : !trade;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = {
      featured: true,
      note: formText(form, "note"),
      example: standalone
        ? {
            title: formText(form, "title"),
            symbol: formText(form, "symbol") || undefined,
          }
        : undefined,
      screenshotIds: images.map(({ id }) => id),
    };
    if (
      await save(
        { record: WORKSPACE_RECORD.HIGHLIGHT, id, revision, input },
        collectScreenshots([images]),
      )
    ) {
      onClose(true);
    }
  }

  async function unfeature() {
    if (!entry) return;
    if (
      await save({
        record: WORKSPACE_RECORD.HIGHLIGHT,
        id,
        revision,
        input: { ...entry, featured: false },
      })
    )
      onClose(true);
  }

  return (
    <Panel
      title={
        trade
          ? trade.symbol + " · " + t[trade.direction]
          : (entry?.example?.title ?? (entry ? m.exampleSource : m.newExample))
      }
      detail={
        trade ? format.date.format(Date.parse(trade.closedAt)) : undefined
      }
    >
      <form className="layout" onSubmit={(event) => void submit(event)}>
        <fieldset className="highlight-editor-fields" disabled={saving}>
          {standalone && (
            <div className="record-field-grid">
              <label>
                {m.title}
                <input
                  name="title"
                  maxLength={WORKSPACE_TITLE_LIMIT}
                  defaultValue={entry?.example?.title}
                  required
                  autoFocus
                />
              </label>
              <label>
                {t.symbol}
                <input
                  name="symbol"
                  maxLength={24}
                  placeholder="EURUSD"
                  defaultValue={entry?.example?.symbol}
                />
              </label>
            </div>
          )}
          <label>
            {m.reason}
            <textarea
              name="note"
              rows={6}
              defaultValue={entry?.note}
              maxLength={WORKSPACE_TEXT_LIMIT}
              autoFocus={!standalone}
            />
          </label>
          <ScreenshotField
            value={images}
            onChange={setImages}
            disabled={saving}
          />
        </fieldset>
        <WorkspaceFeedback status={status} />
        <div className="workspace-actions">
          <button
            type="button"
            className="secondary"
            disabled={saving}
            onClick={() => onClose()}
          >
            {t.cancel}
          </button>
          {entry?.featured && (
            <button
              type="button"
              className="secondary"
              disabled={saving}
              onClick={() => void unfeature()}
            >
              {m.unfeature}
            </button>
          )}
          <WorkspaceSaveButton saving={saving} />
        </div>
      </form>
    </Panel>
  );
}
