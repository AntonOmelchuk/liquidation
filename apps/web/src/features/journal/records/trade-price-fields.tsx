import { useAccountMessages } from "../../accounts/messages.ts";
import type { TradePriceFieldsProps } from "./types.ts";
import { TRADE_PRICE_FIELDS, PRICE_FIELD_LABEL } from "./constants.ts";

export function readTradePrices(form: FormData) {
  const values = TRADE_PRICE_FIELDS.flatMap((key) => {
    const value = String(form.get(PRICE_FIELD_LABEL[key]) ?? "").trim();
    return value ? [[key, Number(value)]] : [];
  });
  return values.length ? Object.fromEntries(values) : undefined;
}

export function TradePriceFields({ initial, closed }: TradePriceFieldsProps) {
  const m = useAccountMessages();
  const fields = closed ? TRADE_PRICE_FIELDS : TRADE_PRICE_FIELDS.slice(0, 3);
  return (
    <details className="trade-tags wide" open={Boolean(initial?.prices)}>
      <summary>{m.tradePrices}</summary>
      <div className="trade-tag-fields">
        {fields.map((key) => {
          const name = PRICE_FIELD_LABEL[key];
          return (
            <label key={key}>
              {m[name]}
              <input
                type="number"
                step="any"
                min={0}
                name={name}
                defaultValue={initial?.prices?.[key]}
              />
            </label>
          );
        })}
        <label className="workspace-check wide">
          <input
            name="breakeven"
            type="checkbox"
            defaultChecked={initial?.breakeven ?? false}
          />
          {m.breakeven}
        </label>
      </div>
      <p className="analytics-hint">{m.priceHint}</p>
    </details>
  );
}
