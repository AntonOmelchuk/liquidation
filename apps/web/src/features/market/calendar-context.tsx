import { localDay } from "@liquidation/domain/workspace/period";
import { upcomingNewsToday } from "@liquidation/domain/market/news-reminders";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import { CALENDAR_CLOCK_MS } from "./constants.ts";
import { useCalendarFeed } from "./feeds.ts";
import type { MarketCalendar } from "./types.ts";

const CalendarContext = createContext<MarketCalendar | null>(null);

export function MarketCalendarProvider({ children }: PropsWithChildren) {
  const feed = useCalendarFeed();
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const timer = window.setInterval(refresh, CALENDAR_CLOCK_MS);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  const value = useMemo(() => {
    const today = localDay(new Date(now).toISOString());
    const upcoming = upcomingNewsToday(feed?.events ?? [], now, today);
    return { feed, now, today, upcoming };
  }, [feed, now]);

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useMarketCalendar() {
  const calendar = useContext(CalendarContext);
  if (!calendar) throw new Error("MarketCalendarProvider is required.");
  return calendar;
}
