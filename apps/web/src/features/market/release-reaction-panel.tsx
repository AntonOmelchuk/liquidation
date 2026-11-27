import {
  CALENDAR_SOURCE,
  MARKET_PROVIDER,
  MINUTE_MS,
  OFFSHORE_YUAN_PAIR,
  QUOTE_SYMBOLS,
  RELEASE_REACTION_MINUTES,
} from "@liquidation/domain/market/constants";
import { defaultReactionSymbol } from "@liquidation/domain/market/release-history";
import { useEffect, useRef, useState } from "react";
import { EMPTY_VALUE, LOCALES } from "../../shared/constants.ts";
import { numericTone } from "../../shared/format.ts";
import { useLocale } from "../../shared/messages.ts";
import { SelectField } from "../../shared/ui/select-field.tsx";
import { MARKET_LINKS } from "./constants.ts";
import { useReleaseReaction } from "./feeds.ts";
import { useMarketMessages } from "./messages.ts";
import { reactionFormatters } from "./quote-format.ts";
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
    () => defaultReactionSymbol(event.currency) ?? "",
  );
  const release = Date.parse(event.at);
  const ready = now >= release + RELEASE_REACTION_MINUTES[0] * MINUTE_MS;
  const result = useReleaseReaction(
    ready && symbol ? { symbol, at: event.at } : undefined,
    event.id,
  );
  const before = result?.data?.before;
  const { price, percent, move } = reactionFormatters(
    LOCALES[language],
    symbol,
    m.pips,
  );

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
          <option value="" disabled>
            {m.chooseReactionSymbol}
          </option>
          {QUOTE_SYMBOLS.map((instrument) => (
            <option value={instrument} key={instrument}>
              {instrument}
            </option>
          ))}
        </SelectField>
      </div>
      {symbol === OFFSHORE_YUAN_PAIR && (
        <p className="market-reaction-method">{m.yuanProxy}</p>
      )}
      {symbol && ready && !result && <p role="status">{t.loading}</p>}
      {result?.failed && !result.data && <p role="status">{m.reactionError}</p>}
      {symbol && (!ready || result?.data) && (
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
                        {move(delta)} · {percent.format(delta / before)}
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
