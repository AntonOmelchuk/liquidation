import {
  CALENDAR_SOURCE,
  MARKET_PROVIDER,
  MINUTE_MS,
  QUOTE_SYMBOLS,
  RELEASE_REACTION_MINUTES,
} from "@liquidation/domain/market/constants";
import { useEffect, useRef, useState } from "react";
import { EMPTY_VALUE, LOCALES } from "../../shared/constants.ts";
import { numericTone } from "../../shared/format.ts";
import { useLocale } from "../../shared/messages.ts";
import { SelectField } from "../../shared/ui/select-field.tsx";
import {
  DEFAULT_QUOTE_SYMBOLS,
  JPY_QUOTE_CURRENCY,
  MARKET_LINKS,
  METAL_QUOTE_SYMBOLS,
  RELEASE_SYMBOLS,
} from "./constants.ts";
import { useReleaseReaction } from "./feeds.ts";
import { useMarketMessages } from "./messages.ts";
import { quotePriceDigits } from "./quote-format.ts";
import type { ReleaseReactionPanelProps } from "./types.ts";

export function ReleaseReactionPanel({
  event,
  id,
  now,
}: ReleaseReactionPanelProps) {
  const m = useMarketMessages();
  const { language, t } = useLocale();
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    panel.current?.scrollIntoView({ block: "nearest" });
  }, []);
  const [symbol, setSymbol] = useState(
    () => RELEASE_SYMBOLS.get(event.currency) ?? DEFAULT_QUOTE_SYMBOLS[0],
  );
  const release = Date.parse(event.at);
  const ready = now >= release + RELEASE_REACTION_MINUTES[0] * MINUTE_MS;
  const result = useReleaseReaction(
    ready ? { symbol, at: event.at } : undefined,
  );
  const before = result?.data?.before;
  const locale = LOCALES[language];
  const digits = quotePriceDigits(symbol);
  const price = new Intl.NumberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  const signedPercent = new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 3,
    signDisplay: "exceptZero",
  });
  const move = new Intl.NumberFormat(locale, {
    maximumFractionDigits: METAL_QUOTE_SYMBOLS.has(symbol) ? 2 : 1,
    signDisplay: "exceptZero",
  });

  function formatMove(delta: number) {
    if (METAL_QUOTE_SYMBOLS.has(symbol)) return move.format(delta) + " USD";
    const pipSize = symbol.endsWith(JPY_QUOTE_CURRENCY) ? 0.01 : 0.0001;
    return move.format(delta / pipSize) + " " + m.pips;
  }

  return (
    <section
      id={id}
      ref={panel}
      className="market-reaction"
      aria-label={m.priceReaction + " · " + event.name}
    >
      <div className="market-reaction-header">
        <strong>{event.name}</strong>
        <SelectField
          label={m.reactionSymbol}
          value={symbol}
          onChange={(change) => setSymbol(change.currentTarget.value)}
        >
          {QUOTE_SYMBOLS.map((instrument) => (
            <option value={instrument} key={instrument}>
              {instrument}
            </option>
          ))}
        </SelectField>
      </div>
      {ready && !result && <p role="status">{t.loading}</p>}
      {result?.failed && !result.data && <p role="status">{m.reactionError}</p>}
      {(!ready || result?.data) && (
        <dl className="market-reaction-readings">
          <div>
            <dt>{m.beforeRelease}</dt>
            <dd>{before == null ? EMPTY_VALUE : price.format(before)}</dd>
          </div>
          {RELEASE_REACTION_MINUTES.map((minutes, index) => {
            const close = result?.data?.closes[index];
            const delta =
              close != null && before != null ? close - before : null;
            const waiting = now < release + minutes * MINUTE_MS;
            return (
              <div key={minutes}>
                <dt>{m.afterRelease(minutes)}</dt>
                <dd>
                  {close != null && delta !== null && before != null ? (
                    <>
                      <strong>{price.format(close)}</strong>
                      <span className={numericTone(delta)}>
                        {formatMove(delta)} ·{" "}
                        {signedPercent.format(delta / before)}
                      </span>
                    </>
                  ) : (
                    <span className="market-reaction-empty">
                      {waiting ? m.reactionWaiting : m.reactionMissing}
                    </span>
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      )}
      <p className="market-reaction-method">
        {m.reactionMethod}{" "}
        <a
          className="record-link"
          href={MARKET_LINKS[CALENDAR_SOURCE.BIQUOTE]}
          target="_blank"
          rel="noreferrer"
        >
          {MARKET_PROVIDER[CALENDAR_SOURCE.BIQUOTE]}
        </a>
        {result?.data?.interval && " · " + result.data.interval}
      </p>
    </section>
  );
}
