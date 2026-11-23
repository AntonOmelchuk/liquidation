import { PLAN_NARRATIVES } from "@liquidation/domain/plans/constants";
import { TRADE_SIDE } from "@liquidation/domain/trades/constants";
import type {
  PlanAnalysisProps,
  PlanExecutionFieldsProps,
  PlanHeaderFieldsProps,
  PlanSetupDetailsProps,
} from "./types.ts";

import { useState } from "react";

import { getPlanNarrative } from "@liquidation/domain/plans/plan-lifecycle";
import { isoToLocalDateTime } from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import { ScreenshotGallery } from "../../../shared/screenshots/screenshot-gallery.tsx";
import { InstrumentPicker } from "../../../shared/ui/instrument-picker.tsx";
import { SelectField } from "../../../shared/ui/select-field.tsx";
import { usePlanMessages } from "../messages.ts";

export function PlanHeaderFields({ setup }: PlanHeaderFieldsProps) {
  const { t } = useLocale();
  const p = usePlanMessages();
  const [symbol, setSymbol] = useState(setup?.symbol ?? "");

  return (
    <>
      <label className="wide">
        {p.title}
        <input
          name="title"
          required
          maxLength={120}
          defaultValue={setup?.title}
        />
      </label>
      <InstrumentPicker value={symbol} onChange={setSymbol} />
      <SelectField
        label={t.side}
        name="direction"
        defaultValue={setup?.direction ?? TRADE_SIDE.LONG}
      >
        <option value={TRADE_SIDE.LONG}>{t.long}</option>
        <option value={TRADE_SIDE.SHORT}>{t.short}</option>
      </SelectField>
      <SelectField
        label={p.narrative}
        name="narrative"
        defaultValue={setup ? getPlanNarrative(setup) : "neutral"}
      >
        {PLAN_NARRATIVES.map((value) => (
          <option key={value} value={value}>
            {p[value]}
          </option>
        ))}
      </SelectField>
      <div className="wide plan-price-fields">
        <label>
          {p.startsOn}
          <input
            type="date"
            name="startsOn"
            required={!setup}
            defaultValue={
              setup
                ? setup.startsOn
                : isoToLocalDateTime(new Date().toISOString()).slice(0, 10)
            }
          />
        </label>
        <label>
          {p.endsOn}
          <input type="date" name="endsOn" defaultValue={setup?.endsOn} />
        </label>
      </div>
      <p className="wide plan-field-hint">{p.oneDayHint}</p>
    </>
  );
}

export function PlanExecutionFields({ setup }: PlanExecutionFieldsProps) {
  const p = usePlanMessages();
  return (
    <>
      <label className="wide">
        {p.entryCondition}
        <textarea
          name="entryCondition"
          required
          rows={5}
          maxLength={4000}
          defaultValue={setup?.entryCondition}
        />
      </label>
      <label className="wide">
        {p.avoid}
        <textarea
          name="avoid"
          rows={2}
          maxLength={4000}
          defaultValue={setup?.avoid}
        />
      </label>
      <div className="plan-price-fields wide">
        <label>
          {p.entry}
          <input
            type="number"
            name="entry"
            step="any"
            defaultValue={setup?.entry}
          />
        </label>
        <label>
          {p.stop}
          <input
            type="number"
            name="stop"
            step="any"
            defaultValue={setup?.stop}
          />
        </label>
        <label>
          {p.target}
          <input
            type="number"
            name="target"
            step="any"
            defaultValue={setup?.target}
          />
        </label>
      </div>
    </>
  );
}

export function PlanSetupDetails({
  setup,
  analysis = true,
}: PlanSetupDetailsProps) {
  const { t, format } = useLocale();
  const p = usePlanMessages();

  return (
    <div className="plan-setup-details">
      <strong>
        {setup.symbol} · {t[setup.direction]} · {p[getPlanNarrative(setup)]} ·{" "}
        {setup.title}
      </strong>
      <p>{setup.entryCondition}</p>
      {setup.avoid && (
        <>
          <strong>{p.avoid}</strong>
          <p>{setup.avoid}</p>
        </>
      )}
      <dl>
        {(["entry", "stop", "target"] as const).map((key) => {
          const value = setup[key];
          return value === undefined ? null : (
            <div key={key}>
              <dt>{p[key]}</dt>
              <dd>{format.price.format(value)}</dd>
            </div>
          );
        })}
      </dl>
      <ScreenshotGallery ids={setup.screenshotIds} />
      {analysis && <PlanAnalysis blocks={setup.analysis} />}
    </div>
  );
}

export function PlanAnalysis({ blocks }: PlanAnalysisProps) {
  if (!blocks?.length) return null;

  return (
    <div className="plan-analysis-grid">
      {blocks.map((block) => (
        <section className="plan-analysis-block" key={block.id}>
          <h3>{block.timeframe}</h3>
          {block.text && <p>{block.text}</p>}
          <ScreenshotGallery ids={block.screenshotIds} />
        </section>
      ))}
    </div>
  );
}
