import { MAX_PLAN_ANALYSIS_BLOCKS } from "@liquidation/domain/plans/constants";
import type { AnalysisDraft, AnalysisFieldsProps } from "./types.ts";

import { ScreenshotField } from "../../../shared/screenshots/screenshot-field.tsx";
import { usePlanMessages } from "../messages.ts";

export function emptyAnalysisBlock(): AnalysisDraft {
  return { id: crypto.randomUUID(), timeframe: "", text: "", screenshots: [] };
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
            <button
              type="button"
              className="secondary"
              aria-label={`${p.removeAnalysis} · ${index + 1}`}
              onClick={() =>
                onChange(blocks.filter((block) => block.id !== id))
              }
            >
              {p.removeAnalysis}
            </button>
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
