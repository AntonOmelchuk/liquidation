import {
  DAILY_QUOTE_ROUTE,
  ZENQUOTES_SITE,
} from "@liquidation/domain/inspiration/constants";
import { dailyQuoteSchema } from "@liquidation/domain/inspiration/contracts";
import { useEffect, useState } from "react";
import { LANGUAGE } from "../../shared/constants.ts";
import { useLocale } from "../../shared/messages.ts";
import { useMarketCalendar } from "../market/calendar-context.tsx";
import { DAILY_REFLECTIONS, DAY_MS } from "./constants.ts";
import type { DatedQuote } from "./types.ts";
import "./daily-quote.css";

export function DailyQuote() {
  const { today } = useMarketCalendar();
  const { language, t } = useLocale();
  const [remote, setRemote] = useState<DatedQuote>();

  useEffect(() => {
    if (language !== LANGUAGE.ENGLISH) return;
    const controller = new AbortController();
    void fetch(DAILY_QUOTE_ROUTE, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return;
        const quote = dailyQuoteSchema.safeParse(await response.json());
        if (quote.success && !controller.signal.aborted)
          setRemote({ day: today, ...quote.data });
      })
      .catch(() => {
        // Keep the local daily reflection when the provider is unavailable.
      });
    return () => controller.abort();
  }, [language, today]);

  const quote =
    language === LANGUAGE.ENGLISH && remote?.day === today ? remote : undefined;
  const dayIndex = Math.floor(Date.parse(today) / DAY_MS);
  const fallback =
    DAILY_REFLECTIONS[dayIndex % DAILY_REFLECTIONS.length][language];

  return (
    <p className="daily-quote">
      <strong>{t.dailyQuote}</strong>
      <q>{quote?.text ?? fallback}</q>
      {quote && (
        <cite>
          {quote.author} ·{" "}
          <a href={ZENQUOTES_SITE} target="_blank" rel="noreferrer">
            ZenQuotes
          </a>
        </cite>
      )}
    </p>
  );
}
