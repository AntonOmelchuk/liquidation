import { backtestCommand } from "@liquidation/domain/backtests/backtest";
import {
  BACKTEST_ACTION,
  BACKTEST_SAMPLE_FIELD,
} from "@liquidation/domain/backtests/constants";
import { TRADE_SIDE } from "@liquidation/domain/trades/constants";
import { useState, type FormEvent } from "react";
import { isoToLocalDateTime, localDateTimeToIso } from "../../shared/format.ts";
import { useLocale } from "../../shared/messages.ts";
import { SCREENSHOT_ERROR } from "../../shared/screenshots/constants.ts";
import {
  collectScreenshots,
  existingScreenshots,
} from "../../shared/screenshots/draft.ts";
import { useScreenshotMessages } from "../../shared/screenshots/messages.ts";
import { ScreenshotField } from "../../shared/screenshots/screenshot-field.tsx";
import { InstrumentPicker } from "../../shared/ui/instrument-picker.tsx";
import { SelectField } from "../../shared/ui/select-field.tsx";
import { JournalRequestError } from "../journal/data/api.ts";
import { useJournal } from "../journal/data/store.ts";
import { useBacktestMessages } from "./messages.ts";
import type { BacktestSampleFormProps } from "./types.ts";

function readDate(data: FormData, name: string, existing?: string) {
  const value = data.get(name);
  return existing && value === isoToLocalDateTime(existing)
    ? existing
    : localDateTimeToIso(value);
}

export function BacktestSampleForm({
  run,
  sample,
  finish,
}: BacktestSampleFormProps) {
  const { t } = useLocale();
  const b = useBacktestMessages();
  const screenshotMessages = useScreenshotMessages();
  const saveSample = useJournal((state) => state.updateBacktest);
  const [id] = useState(() => sample?.id ?? crypto.randomUUID());
  const [revision] = useState(run.revision);
  const [symbol, setSymbol] = useState(sample?.symbol ?? "");
  const [shots, setShots] = useState(() =>
    existingScreenshots(sample?.screenshotIds),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<
    "invalid" | "conflict" | "saveError" | typeof SCREENSHOT_ERROR.UPLOAD_LIMIT
  >();

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const data = new FormData(event.currentTarget);
    const command = backtestCommand.safeParse({
      id: run.id,
      action: sample ? BACKTEST_ACTION.EDIT_SAMPLE : BACKTEST_ACTION.ADD_SAMPLE,
      revision,
      sample: {
        id,
        symbol: data.get("symbol"),
        direction: data.get("direction"),
        timeframe: String(data.get("timeframe") ?? "").trim() || undefined,
        openedAt: readDate(data, "openedAt", sample?.openedAt),
        closedAt: readDate(data, "closedAt", sample?.closedAt),
        entry: data.get(BACKTEST_SAMPLE_FIELD.ENTRY)
          ? Number(data.get(BACKTEST_SAMPLE_FIELD.ENTRY))
          : null,
        stop: data.get(BACKTEST_SAMPLE_FIELD.STOP)
          ? Number(data.get(BACKTEST_SAMPLE_FIELD.STOP))
          : null,
        exit: data.get(BACKTEST_SAMPLE_FIELD.EXIT)
          ? Number(data.get(BACKTEST_SAMPLE_FIELD.EXIT))
          : null,
        costsR: Number(data.get(BACKTEST_SAMPLE_FIELD.COSTS_R)),
        notes: data.get("notes"),
        screenshotIds: shots.map(({ id }) => id),
      },
    });
    if (!command.success) {
      setError("invalid");
      return;
    }
    const files = collectScreenshots([shots]);
    if (!files) {
      setError(SCREENSHOT_ERROR.UPLOAD_LIMIT);
      return;
    }
    setError(undefined);
    setSaving(true);
    try {
      await saveSample(command.data, files);
      finish();
    } catch (failure) {
      setError(
        failure instanceof JournalRequestError && failure.status === 409
          ? "conflict"
          : "saveError",
      );
      setSaving(false);
    }
  }

  return (
    <form className="timeline-form" onSubmit={save}>
      <h3>{sample ? b.editSample : b.addSample}</h3>
      <fieldset disabled={saving}>
        <InstrumentPicker value={symbol} onChange={setSymbol} />
        <SelectField
          label={t.side}
          name="direction"
          defaultValue={sample?.direction ?? TRADE_SIDE.LONG}
        >
          <option value={TRADE_SIDE.LONG}>{t.long}</option>
          <option value={TRADE_SIDE.SHORT}>{t.short}</option>
        </SelectField>
        <label>
          {t.opened}
          <input
            name="openedAt"
            type="datetime-local"
            required
            defaultValue={
              sample ? isoToLocalDateTime(sample.openedAt) : undefined
            }
          />
        </label>
        <label>
          {t.closed}
          <input
            name="closedAt"
            type="datetime-local"
            required
            defaultValue={
              sample ? isoToLocalDateTime(sample.closedAt) : undefined
            }
          />
        </label>
        <div className="record-field-grid wide">
          {(
            [
              [BACKTEST_SAMPLE_FIELD.ENTRY, b.entryPrice],
              [BACKTEST_SAMPLE_FIELD.STOP, b.stopPrice],
              [BACKTEST_SAMPLE_FIELD.EXIT, b.exitPrice],
              [BACKTEST_SAMPLE_FIELD.COSTS_R, b.costsR],
            ] as const
          ).map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                type="number"
                step="any"
                name={key}
                required
                min={key === BACKTEST_SAMPLE_FIELD.COSTS_R ? 0 : undefined}
                defaultValue={
                  sample?.[key] ??
                  (key === BACKTEST_SAMPLE_FIELD.COSTS_R ? 0 : undefined)
                }
              />
            </label>
          ))}
        </div>
        <label>
          {t.timeframe}
          <input
            name="timeframe"
            maxLength={24}
            defaultValue={sample?.timeframe}
          />
        </label>
        <label className="wide">
          {t.notes}
          <textarea
            name="notes"
            rows={3}
            maxLength={4000}
            defaultValue={sample?.notes}
          />
        </label>
        <div className="wide">
          <ScreenshotField
            value={shots}
            onChange={setShots}
            disabled={saving}
          />
        </div>
        {error && (
          <p className="wide error" role="alert">
            {error === SCREENSHOT_ERROR.UPLOAD_LIMIT
              ? screenshotMessages.uploadLimit
              : b[error]}
          </p>
        )}
        <div className="wide record-form-actions">
          <button type="button" className="secondary" onClick={finish}>
            {t.cancel}
          </button>
          <button type="submit">{saving ? t.saving : b.saveSample}</button>
        </div>
      </fieldset>
    </form>
  );
}
