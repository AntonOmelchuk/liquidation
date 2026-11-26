import { useEffect, useMemo, useRef, useState } from "react";
import { EMPTY_VALUE, LOCALES } from "../../shared/constants.ts";
import { numericTone } from "../../shared/format.ts";
import { useLocale } from "../../shared/messages.ts";
import { InstrumentIcons } from "../../shared/ui/instrument-picker.tsx";
import { QUOTE_FRESH_MS, QUOTE_SCROLL_PX_PER_SECOND } from "./constants.ts";
import { quotePriceDigits } from "./quote-format.ts";
import { useMarketMessages } from "./messages.ts";
import type { QuoteTapeProps, QuoteTrackStyle } from "./types.ts";

export function QuoteTape({
  symbols,
  prices,
  unavailable,
  paused,
  receivedAt,
}: QuoteTapeProps) {
  const { format, language } = useLocale();
  const quoteFormatters = useMemo(() => {
    const formatter = (digits: number) =>
      new Intl.NumberFormat(LOCALES[language], {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      });
    return { 2: formatter(2), 3: formatter(3), 5: formatter(5) };
  }, [language]);
  const m = useMarketMessages();
  const viewport = useRef<HTMLDivElement>(null);
  const segment = useRef<HTMLUListElement>(null);
  const [layout, setLayout] = useState({ width: 0, copies: 0 });

  useEffect(() => {
    const area = viewport.current;
    const items = segment.current;
    if (!area || !items) return;
    const observer = new ResizeObserver(() => {
      const width = items.offsetWidth;
      const copies = width ? Math.ceil(area.clientWidth / width) : 0;
      setLayout((previous) =>
        previous.width === width && previous.copies === copies
          ? previous
          : { width, copies },
      );
    });
    observer.observe(area);
    observer.observe(items);
    return () => observer.disconnect();
  }, []);

  const rows = symbols.map((symbol) => {
    const quote = prices?.find((item) => item.symbol === symbol);
    const timestamp = quote ? Date.parse(quote.at) : null;
    const current =
      quote &&
      !unavailable &&
      !quote.closed &&
      !quote.stale &&
      timestamp !== null &&
      receivedAt - timestamp < QUOTE_FRESH_MS;
    const change = quote?.changePercent;
    const priceFormat = quoteFormatters[quotePriceDigits(symbol)];
    const detail =
      timestamp === null
        ? prices || unavailable
          ? m.noPrice
          : m.awaiting
        : (quote?.closed ? m.closedMarket : current ? m.updated : m.lastTick) +
          " · " +
          format.date.format(timestamp);
    return (
      <li key={symbol} className="quote-row">
        <span className="instrument-label">
          <InstrumentIcons symbol={symbol} />
          <strong>{symbol}</strong>
        </span>
        <span className="quote-price" title={detail}>
          <strong>
            {quote ? priceFormat.format(quote.price) : EMPTY_VALUE}
          </strong>
          {change !== undefined && (
            <span className={numericTone(change)} title={m.dailyChange}>
              {change > 0 && "+"}
              {format.percentage.format(change / 100)}
            </span>
          )}
        </span>
      </li>
    );
  });

  const moving = !paused && Boolean(prices?.length) && layout.width > 0;
  const style: QuoteTrackStyle = {
    "--quote-segment": layout.width + "px",
    animationDuration: layout.width / QUOTE_SCROLL_PX_PER_SECOND + "s",
  };
  return (
    <>
      {unavailable && (
        <p className="visually-hidden" role="status">
          {m.quotesUnavailable}
        </p>
      )}
      <div
        ref={viewport}
        className="quote-conveyor"
        data-moving={moving || undefined}
        role="region"
        aria-label={m.quotes}
        tabIndex={0}
      >
        <div className="quote-track" style={style}>
          <ul ref={segment} className="quote-list">
            {rows}
          </ul>
          {moving &&
            Array.from({ length: layout.copies }, (_, index) => (
              <ul
                key={index}
                className="quote-list quote-repeat"
                aria-hidden="true"
              >
                {rows}
              </ul>
            ))}
        </div>
      </div>
    </>
  );
}
