import { INSTRUMENT_MARKET } from "@liquidation/domain/instruments/constants";
import { instrumentMarket } from "@liquidation/domain/instruments/instruments";
import { TRADE_TAG_LIMITS } from "@liquidation/domain/trades/constants";
import {
  HIGHLIGHT_TYPE,
  WORKSPACE_RECORD,
  WORKSPACE_TEXT_LIMIT,
  WORKSPACE_TITLE_LIMIT,
} from "@liquidation/domain/workspace/constants";
import { localDay } from "@liquidation/domain/workspace/period";
import { useId, useState } from "react";
import type { FormEvent } from "react";
import { highlightHref } from "../../../app/page.ts";
import { useLocale } from "../../../shared/messages.ts";
import {
  collectScreenshots,
  existingScreenshots,
} from "../../../shared/screenshots/draft.ts";
import { ScreenshotField } from "../../../shared/screenshots/screenshot-field.tsx";
import { InstrumentPicker } from "../../../shared/ui/instrument-picker.tsx";
import { Panel } from "../../../shared/ui/layout.tsx";
import { SelectField } from "../../../shared/ui/select-field.tsx";
import {
  AnalysisFields,
  analysisDraft,
  readAnalysisBlocks,
} from "../../plans/editor/analysis-fields.tsx";
import {
  PlanPlaybookField,
  readPlanPlaybook,
} from "../../plans/editor/plan-playbook.tsx";
import { formText } from "../form.ts";
import { useWorkspaceMessages } from "../messages.ts";
import { useWorkspaceSave } from "../use-workspace-save.ts";
import {
  WorkspaceFeedback,
  WorkspaceSaveButton,
} from "../workspace-feedback.tsx";
import { HIGHLIGHT_STYLES } from "./constants.ts";
import { useHighlightMessages } from "./messages.ts";
import type { HighlightEditorProps } from "./types.ts";

export function HighlightEditor({
  trade,
  entry,
  details,
}: HighlightEditorProps) {
  const { t } = useLocale();
  const m = useWorkspaceMessages();
  const h = useHighlightMessages();
  const [id] = useState(() => trade?.id ?? entry?.id ?? crypto.randomUUID());
  const [revision] = useState(entry?.revision);
  const [symbol, setSymbol] = useState(
    entry?.example?.symbol ?? trade?.symbol ?? "",
  );
  const [images, setImages] = useState(() =>
    existingScreenshots(entry?.screenshotIds),
  );
  const [blocks, setBlocks] = useState(() => analysisDraft(entry?.analysis));
  const { status, saving, save } = useWorkspaceSave();
  const styleList = useId();
  const standalone = entry ? Boolean(entry.example) : !trade;
  const market = instrumentMarket(symbol);
  const backHref = entry?.featured ? highlightHref(entry.id) : highlightHref();
  const title = entry?.example?.title ?? trade?.symbol ?? m.newExample;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const rr = formText(form, "rr");
    const input = {
      featured: true,
      note: formText(form, "note"),
      example: standalone
        ? { title: formText(form, "title"), symbol: symbol.trim() || undefined }
        : undefined,
      details: {
        date: formText(form, "date") || undefined,
        market: formText(form, "market") || undefined,
        style: formText(form, "style") || undefined,
        timeframe: formText(form, "timeframe") || undefined,
        model: formText(form, "model") || undefined,
        playbook: readPlanPlaybook(form),
        rr: rr ? Number(rr) : undefined,
        type: formText(form, "type") || undefined,
      },
      analysis: readAnalysisBlocks(blocks),
      screenshotIds: images.map(({ id }) => id),
    };
    if (
      await save(
        { record: WORKSPACE_RECORD.HIGHLIGHT, id, revision, input },
        collectScreenshots([
          images,
          ...blocks.map(({ screenshots }) => screenshots),
        ]),
      )
    ) {
      window.location.hash = highlightHref(id);
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
      window.location.hash = highlightHref();
  }

  return (
    <main className="workspace-page highlight-document">
      <a className="record-back" href={backHref}>
        ← {m.bestTrades}
      </a>
      <div className="page-heading">
        <h1>{title}</h1>
      </div>
      <form className="layout" onSubmit={(event) => void submit(event)}>
        <fieldset className="layout highlight-editor-fields" disabled={saving}>
          <Panel title={h.tradeDetails}>
            <div className="record-field-grid">
              {standalone && (
                <>
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
                  <InstrumentPicker
                    value={symbol}
                    onChange={setSymbol}
                    required={false}
                  />
                </>
              )}
              <label>
                {h.date}
                <input
                  type="date"
                  name="date"
                  defaultValue={
                    details.date ??
                    (entry ? "" : localDay(new Date().toISOString()))
                  }
                />
              </label>
              <SelectField
                label={h.market}
                name="market"
                defaultValue={entry?.details?.market ?? ""}
              >
                <option value="">
                  {market
                    ? h.autoMarket + " · " + h.markets[market]
                    : h.autoMarket}
                </option>
                {Object.values(INSTRUMENT_MARKET).map((value) => (
                  <option key={value} value={value}>
                    {h.markets[value]}
                  </option>
                ))}
              </SelectField>
              <label>
                {h.style}
                <input
                  name="style"
                  list={styleList}
                  maxLength={TRADE_TAG_LIMITS.style}
                  defaultValue={details.style}
                />
                <datalist id={styleList}>
                  {HIGHLIGHT_STYLES.map((value) => (
                    <option key={value} value={value} />
                  ))}
                </datalist>
              </label>
              <label>
                {h.timeframe}
                <input
                  name="timeframe"
                  maxLength={24}
                  placeholder="H4"
                  defaultValue={details.timeframe}
                />
              </label>
              <label>
                {h.model}
                <input
                  name="model"
                  maxLength={WORKSPACE_TITLE_LIMIT}
                  defaultValue={details.model}
                />
              </label>
              <PlanPlaybookField initial={details.playbook} />
              <label title={h.plannedRR}>
                {h.rr}
                <input
                  name="rr"
                  type="number"
                  min="0"
                  step="any"
                  defaultValue={details.rr}
                />
              </label>
              <SelectField
                label={h.type}
                name="type"
                defaultValue={details.type ?? ""}
              >
                <option value="">{t.unspecified}</option>
                {Object.values(HIGHLIGHT_TYPE).map((value) => (
                  <option key={value} value={value}>
                    {h.types[value]}
                  </option>
                ))}
              </SelectField>
              <label className="wide">
                {m.reason}
                <textarea
                  name="note"
                  rows={5}
                  defaultValue={entry?.note}
                  maxLength={WORKSPACE_TEXT_LIMIT}
                />
              </label>
              <div className="wide">
                <ScreenshotField
                  value={images}
                  onChange={setImages}
                  disabled={saving}
                />
              </div>
            </div>
          </Panel>
          <Panel title={h.analysis}>
            <AnalysisFields
              blocks={blocks}
              onChange={setBlocks}
              saving={saving}
            />
          </Panel>
        </fieldset>
        <WorkspaceFeedback status={status} />
        <div className="workspace-actions">
          <a className="action-link secondary" href={backHref}>
            {t.cancel}
          </a>
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
    </main>
  );
}
