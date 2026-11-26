import {
  CALENDAR_SOURCE,
  MARKET_PROVIDER,
  MAX_QUOTE_SYMBOLS,
  QUOTE_SYMBOLS,
} from "@liquidation/domain/market/constants";
import { useId } from "react";
import { usePreferences } from "../../app/preferences.ts";
import { CheckboxField } from "../../shared/ui/checkbox-field.tsx";
import { InstrumentIcons } from "../../shared/ui/instrument-picker.tsx";
import { MARKET_LINKS } from "./constants.ts";
import { useMarketMessages } from "./messages.ts";
import { useQuoteSymbols } from "./use-quote-symbols.ts";
import "./quote-settings.css";

export function QuoteSettings() {
  const m = useMarketMessages();
  const heading = useId();
  const symbols = useQuoteSymbols();
  const animate = usePreferences((state) => state.quoteMotion);
  const update = usePreferences((state) => state.update);
  const atLimit = symbols.length >= MAX_QUOTE_SYMBOLS;
  const source = CALENDAR_SOURCE.BIQUOTE;

  return (
    <section className="quote-settings" aria-labelledby={heading}>
      <h3 id={heading}>{m.quoteSettings}</h3>
      <details className="quote-selection">
        <summary>
          {m.select}
          <span className="quote-selection-count">
            {symbols.length}/{MAX_QUOTE_SYMBOLS}
          </span>
        </summary>
        <fieldset className="quote-options">
          <legend className="visually-hidden">{m.select}</legend>
          {QUOTE_SYMBOLS.map((symbol) => {
            const selected = symbols.includes(symbol);
            return (
              <CheckboxField
                key={symbol}
                className="quote-option"
                checked={selected}
                disabled={!selected && atLimit}
                onChange={() =>
                  update({
                    quoteSymbols: selected
                      ? symbols.filter((value) => value !== symbol)
                      : [...symbols, symbol],
                  })
                }
              >
                <span className="instrument-label">
                  <InstrumentIcons symbol={symbol} />
                  {symbol}
                </span>
              </CheckboxField>
            );
          })}
        </fieldset>
      </details>
      {symbols.length === 0 && <p className="subdued">{m.noPairs}</p>}
      <div className="quote-settings-footer">
        <CheckboxField
          checked={animate}
          onChange={(event) => update({ quoteMotion: event.target.checked })}
        >
          {m.animate}
        </CheckboxField>
        <a
          className="record-link"
          href={MARKET_LINKS[source]}
          target="_blank"
          rel="noreferrer"
        >
          {MARKET_PROVIDER[source]}
        </a>
      </div>
    </section>
  );
}
