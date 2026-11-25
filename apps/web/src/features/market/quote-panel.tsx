import {
  CALENDAR_SOURCE,
  MARKET_PROVIDER,
  MAX_QUOTE_SYMBOLS,
  QUOTE_SYMBOLS,
} from "@liquidation/domain/market/constants";
import { quoteSelectionSchema } from "@liquidation/domain/market/contracts";
import { useState } from "react";
import { usePreferences } from "../../app/preferences.ts";
import { CheckboxField } from "../../shared/ui/checkbox-field.tsx";
import { DEFAULT_QUOTE_SYMBOLS, MARKET_LINKS } from "./constants.ts";
import { useQuoteFeed } from "./feeds.ts";
import { useMarketMessages } from "./messages.ts";
import { QuoteTape } from "./quote-tape.tsx";

export function QuotePanel() {
  const m = useMarketMessages();
  const stored = usePreferences((state) => state.quoteSymbols);
  const setPreferences = usePreferences((state) => state.update);
  const selection = quoteSelectionSchema.safeParse(stored);
  const symbols = selection.success ? selection.data : DEFAULT_QUOTE_SYMBOLS;
  const { prices, unavailable, receivedAt } = useQuoteFeed(symbols.join(","));
  const [paused, setPaused] = useState(false);

  return (
    <section
      id="market-quotes"
      className="quote-ticker"
      aria-labelledby="quotes-title"
    >
      <div className="quote-toolbar">
        <div className="quote-heading">
          <h2 id="quotes-title">{m.quotes}</h2>
          <a
            className="record-link"
            href={MARKET_LINKS[CALENDAR_SOURCE.BIQUOTE]}
            target="_blank"
            rel="noreferrer"
          >
            {MARKET_PROVIDER[CALENDAR_SOURCE.BIQUOTE]}
          </a>
        </div>
        <div className="quote-actions">
          {Boolean(prices?.length) && (
            <button
              type="button"
              className="secondary quote-pause"
              onClick={() => setPaused((value) => !value)}
            >
              {paused ? m.resume : m.pause}
            </button>
          )}
          <details className="quote-picker">
            <summary>
              {m.select}{" "}
              <small>
                {symbols.length}/{MAX_QUOTE_SYMBOLS}
              </small>
            </summary>
            <fieldset className="quote-options">
              <legend className="visually-hidden">{m.select}</legend>
              {QUOTE_SYMBOLS.map((symbol) => {
                const selected = symbols.includes(symbol);
                return (
                  <CheckboxField
                    key={symbol}
                    checked={selected}
                    disabled={!selected && symbols.length >= MAX_QUOTE_SYMBOLS}
                    onChange={() =>
                      setPreferences({
                        quoteSymbols: selected
                          ? symbols.filter((value) => value !== symbol)
                          : [...symbols, symbol],
                      })
                    }
                  >
                    {symbol}
                  </CheckboxField>
                );
              })}
            </fieldset>
          </details>
        </div>
      </div>
      {symbols.length > 0 ? (
        <QuoteTape
          symbols={symbols}
          prices={prices}
          unavailable={unavailable}
          paused={paused}
          receivedAt={receivedAt}
        />
      ) : (
        <p className="market-status">{m.noPairs}</p>
      )}
    </section>
  );
}
