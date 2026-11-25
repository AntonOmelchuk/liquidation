import type { TradeLinks } from "@liquidation/domain/trades/types";
import { useState } from "react";
import {
  collectScreenshots,
  existingScreenshots,
} from "../../../shared/screenshots/draft.ts";
import { ScreenshotField } from "../../../shared/screenshots/screenshot-field.tsx";
import { ScreenshotGallery } from "../../../shared/screenshots/screenshot-gallery.tsx";
import { Panel } from "../../../shared/ui/layout.tsx";
import { useTradeRecordMessages } from "./messages.ts";
import type { TradeEvidenceDraft, TradeEvidenceFieldsProps } from "./types.ts";

export function useTradeEvidence(initial?: TradeLinks) {
  const [draft, setDraft] = useState<TradeEvidenceDraft>(() => ({
    entry: existingScreenshots(initial?.entryScreenshotIds),
    exit: existingScreenshots(initial?.exitScreenshotIds),
  }));
  return { draft, setDraft };
}

export function readTradeEvidence(draft: TradeEvidenceDraft) {
  return {
    entryScreenshotIds: draft.entry.length
      ? draft.entry.map(({ id }) => id)
      : undefined,
    exitScreenshotIds: draft.exit.length
      ? draft.exit.map(({ id }) => id)
      : undefined,
  };
}

export function tradeEvidenceUploads(draft: TradeEvidenceDraft) {
  return collectScreenshots([draft.entry, draft.exit]);
}

export function TradeEvidenceFields({
  draft,
  onChange,
  closed,
  disabled,
}: TradeEvidenceFieldsProps) {
  const m = useTradeRecordMessages();
  return (
    <Panel title={m.evidence}>
      <div className="trade-evidence-grid">
        <section>
          <h3>{m.entryEvidence}</h3>
          <ScreenshotField
            value={draft.entry}
            onChange={(entry) => onChange({ ...draft, entry })}
            disabled={disabled}
          />
        </section>
        {(closed || draft.exit.length > 0) && (
          <section>
            <h3>{m.exitEvidence}</h3>
            <ScreenshotField
              value={draft.exit}
              onChange={(exit) => onChange({ ...draft, exit })}
              disabled={disabled}
            />
          </section>
        )}
      </div>
    </Panel>
  );
}

export function TradeEvidenceGallery({ record }: { record: TradeLinks }) {
  const m = useTradeRecordMessages();
  return (
    <Panel title={m.evidence}>
      {record.entryScreenshotIds?.length || record.exitScreenshotIds?.length ? (
        <div className="trade-evidence-grid">
          {Boolean(record.entryScreenshotIds?.length) && (
            <section>
              <h3>{m.entryEvidence}</h3>
              <ScreenshotGallery ids={record.entryScreenshotIds} />
            </section>
          )}
          {Boolean(record.exitScreenshotIds?.length) && (
            <section>
              <h3>{m.exitEvidence}</h3>
              <ScreenshotGallery ids={record.exitScreenshotIds} />
            </section>
          )}
        </div>
      ) : (
        <p>{m.noEvidence}</p>
      )}
    </Panel>
  );
}
