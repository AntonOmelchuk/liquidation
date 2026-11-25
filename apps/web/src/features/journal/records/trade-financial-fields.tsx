import { fromCents } from "@liquidation/domain/shared/money";
import {
  MAX_TRADE_RISK_PERCENT,
  PNL_CALCULATION,
  TRADE_RISK_PERCENT_STEP,
} from "@liquidation/domain/trades/constants";
import { calculatedGrossProfit } from "@liquidation/domain/trades/financials";
import { netCents } from "@liquidation/domain/trades/trade";
import type {
  PnlCalculation,
  TradePrices,
} from "@liquidation/domain/trades/types";
import { useId, useState } from "react";
import { EMPTY_VALUE } from "../../../shared/constants.ts";
import { numericTone } from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import { SelectField } from "../../../shared/ui/select-field.tsx";
import { useTradeRecordMessages } from "./messages.ts";
import { TradePriceFields } from "./trade-price-fields.tsx";
import type {
  PnlMode,
  TradeOutcomeFieldsProps,
  TradeRiskFieldsProps,
} from "./types.ts";

export function readPnlCalculation(data: FormData): PnlCalculation | undefined {
  const method = data.get("pnlMode");
  if (method === PNL_CALCULATION.PRICES) return { mode: method };
  if (method === PNL_CALCULATION.R_MULTIPLE)
    return {
      mode: method,
      multiple: optionalNumber(data.get("outcomeR")) ?? NaN,
    };
  return undefined;
}

function optionalNumber(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  const amount = Number(text);
  return text && Number.isFinite(amount) ? amount : null;
}

export function TradeRiskFields({
  value,
  onChange,
  hasAccount,
  sizing,
  risk,
  currency,
}: TradeRiskFieldsProps) {
  const { format } = useLocale();
  const m = useTradeRecordMessages();
  const hint = useId();
  const money = (amount: number) =>
    format.money.format(amount) + " " + currency;
  return (
    <div className="trade-risk-field">
      <label>
        {m.riskPercent}
        <input
          name="riskPercent"
          type="number"
          min={TRADE_RISK_PERCENT_STEP}
          max={MAX_TRADE_RISK_PERCENT}
          step={TRADE_RISK_PERCENT_STEP}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-describedby={hint}
          aria-invalid={Boolean(value && risk === null)}
          placeholder="0.5"
        />
      </label>
      <p className="analytics-hint" id={hint}>
        {!hasAccount ? m.riskAccountHint : m.riskBalanceHint}
      </p>
      {risk !== null && (
        <output className="trade-financial-preview">
          <strong>1R · {money(risk)}</strong>
          {sizing && (
            <span>
              {m.entryBalance} · {money(fromCents(sizing.balanceCents))}
            </span>
          )}
        </output>
      )}
    </div>
  );
}

export function TradeOutcomeFields({
  initial,
  direction,
  risk,
  currency,
  automatic,
}: TradeOutcomeFieldsProps) {
  const { t, format } = useLocale();
  const m = useTradeRecordMessages();
  const [chosen, choose] = useState<PnlMode>();
  const [manual, setManual] = useState("");
  const [multiple, setMultiple] = useState("");
  const [commission, setCommission] = useState("0");
  const [swap, setSwap] = useState("0");
  const [prices, setPrices] = useState<TradePrices | undefined>(
    initial?.prices,
  );
  const mode =
    chosen ?? (automatic ? PNL_CALCULATION.PRICES : PNL_CALCULATION.MANUAL);
  const byPrice = mode === PNL_CALCULATION.PRICES;
  const byMultiple = mode === PNL_CALCULATION.R_MULTIPLE;
  const gross =
    mode === PNL_CALCULATION.MANUAL
      ? optionalNumber(manual)
      : calculatedGrossProfit(
          risk,
          byPrice
            ? { mode: PNL_CALCULATION.PRICES }
            : {
                mode: PNL_CALCULATION.R_MULTIPLE,
                multiple: optionalNumber(multiple) ?? NaN,
              },
          direction,
          prices,
        );
  const net =
    gross === null
      ? null
      : fromCents(
          netCents({
            profit: gross,
            commission: Number(commission),
            swap: Number(swap),
          }),
        );
  const money = (amount: number | null) =>
    amount === null
      ? EMPTY_VALUE
      : format.money.format(amount) + " " + currency;

  return (
    <>
      <label>
        {t.closed}
        <input type="datetime-local" name="closedAt" required />
      </label>
      <SelectField
        label={m.pnlMode}
        name="pnlMode"
        value={mode}
        onChange={(event) => {
          const next = Object.values(PNL_CALCULATION).find(
            (item) => item === event.target.value,
          );
          if (next) choose(next);
        }}
      >
        <option value={PNL_CALCULATION.PRICES}>{m.pnlByPrices}</option>
        <option value={PNL_CALCULATION.R_MULTIPLE}>{m.pnlByR}</option>
        <option value={PNL_CALCULATION.MANUAL}>{m.pnlManual}</option>
      </SelectField>
      {mode === PNL_CALCULATION.MANUAL && (
        <label className="wide">
          {t.gross}
          <input
            type="number"
            step="0.01"
            name="profit"
            value={manual}
            onChange={(event) => {
              choose(PNL_CALCULATION.MANUAL);
              setManual(event.currentTarget.value);
            }}
            required
          />
        </label>
      )}
      {byMultiple && (
        <label className="wide">
          {m.grossMultiple}
          <input
            type="number"
            step="any"
            name="outcomeR"
            value={multiple}
            onChange={(event) => setMultiple(event.currentTarget.value)}
            required
          />
        </label>
      )}
      {mode !== PNL_CALCULATION.MANUAL && (
        <p className="analytics-hint wide">
          {risk === null
            ? m.pnlNeedsRisk
            : byPrice
              ? m.pnlPriceHint
              : m.pnlRHint}
        </p>
      )}
      <TradePriceFields
        initial={initial}
        closed
        forceOpen={byPrice}
        onPriceChange={(key, value) =>
          setPrices((previous) => ({ ...previous, [key]: value }))
        }
      />
      <label>
        {t.commission}
        <input
          type="number"
          step="0.01"
          name="commission"
          value={commission}
          onChange={(event) => setCommission(event.currentTarget.value)}
        />
      </label>
      <label>
        {t.swap}
        <input
          type="number"
          step="0.01"
          name="swap"
          value={swap}
          onChange={(event) => setSwap(event.currentTarget.value)}
        />
      </label>
      <output className="trade-financial-preview wide">
        {risk !== null && <span>1R · {money(risk)}</span>}
        <span>
          {t.gross} · {money(gross)}
        </span>
        <strong className={net === null ? undefined : numericTone(net)}>
          {t.pnl} · {money(net)}
        </strong>
      </output>
    </>
  );
}
