import { ICON_ACTION } from "../../../shared/ui/constants.ts";
import { IconAction } from "../../../shared/ui/icon-action.tsx";
import { MAX_PLAN_ANALYSIS_BLOCKS } from "@liquidation/domain/plans/constants";
import type { PlanAnalysisBlock } from "@liquidation/domain/plans/types";
import type { AnalysisDraft, AnalysisFieldsProps } from "./types.ts";

import { ScreenshotField } from "../../../shared/screenshots/screenshot-field.tsx";
import { existingScreenshots } from "../../../shared/screenshots/draft.ts";
import { usePlanMessages } from "../messages.ts";

export function emptyAnalysisBlock(): AnalysisDraft {
  return { id: crypto.randomUUID(), timeframe: "", text: "", screenshots: [] };
}

export function analysisDraft(blocks?: readonly PlanAnalysisBlock[]) {
  return (
    blocks?.map(({ screenshotIds, ...block }) => ({
      ...block,
      screenshots: existingScreenshots(screenshotIds),
    })) ?? []
  );
}

export function readAnalysisBlocks(blocks: readonly AnalysisDraft[]) {
  const filled = blocks.filter(
    ({ text, screenshots }) => text.trim() || screenshots.length,
  );
  return filled.length
    ? filled.map(({ screenshots, ...block }) => ({
        ...block,
        screenshotIds: screenshots.map(({ id }) => id),
      }))
    : undefined;
}

export function AnalysisFields({
  blocks,
  onChange,
  saving,
}: AnalysisFieldsProps) {
  const p = usePlanMessages();

  function update(id: string, changes: Partial<Omit<AnalysisDraft, "id">>) {
    onChange(
      blocks.map((block) =>
        block.id === id ? { ...block, ...changes } : block,
      ),
    );
  }

  return (
    <div className="plan-evidence-editor">
      {blocks.map(({ id, timeframe, text, screenshots }, index) => (
        <div className="plan-analysis-block" key={id}>
          <div className="plan-actions">
            <label>
              {p.timeframe}
              <input
                value={timeframe}
                onChange={(event) =>
                  update(id, { timeframe: event.target.value })
                }
                maxLength={24}
                placeholder="H4"
                required={Boolean(text.trim() || screenshots.length)}
              />
            </label>
            <IconAction
              icon={ICON_ACTION.DELETE}
              label={`${p.removeAnalysis} · ${index + 1}`}
              onClick={() =>
                onChange(blocks.filter((block) => block.id !== id))
              }
            />
          </div>
          <label>
            {p.analysisNotes}
            <textarea
              value={text}
              onChange={(event) => update(id, { text: event.target.value })}
              maxLength={4000}
              rows={3}
            />
          </label>
          <ScreenshotField
            value={screenshots}
            onChange={(value) => update(id, { screenshots: value })}
            disabled={saving}
          />
        </div>
      ))}
      <div>
        <button
          type="button"
          className="secondary"
          disabled={blocks.length >= MAX_PLAN_ANALYSIS_BLOCKS}
          onClick={() => onChange([...blocks, emptyAnalysisBlock()])}
        >
          <span aria-hidden="true">＋</span> {p.addAnalysis}
        </button>
      </div>
    </div>
  );
}
