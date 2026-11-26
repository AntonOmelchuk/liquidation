import { usePreferences } from "../../app/preferences.ts";
import { useQuoteFeed } from "./feeds.ts";
import { QuoteTape } from "./quote-tape.tsx";
import { useQuoteSymbols } from "./use-quote-symbols.ts";

export function QuotePanel() {
  const symbols = useQuoteSymbols();
  const animate = usePreferences((state) => state.quoteMotion);
  const quotes = useQuoteFeed(symbols.join(","));

  if (symbols.length === 0) return null;

  return (
    <div id="market-quotes" className="quote-ticker">
      <QuoteTape symbols={symbols} paused={!animate} {...quotes} />
    </div>
  );
}
