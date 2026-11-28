import { MINUTE_MS } from "@liquidation/domain/market/constants";
import { dueNewsReminders } from "@liquidation/domain/market/news-reminders";
import { useEffect, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useLocale } from "../../shared/messages.ts";
import { useMarketCalendar } from "./calendar-context.tsx";
import {
  MARKET_CALENDAR_HREF,
  NEWS_TOAST_DURATION_MS,
  NEWS_TOAST_LIMIT,
  SHOWN_NEWS_KEY,
} from "./constants.ts";
import { useMarketMessages } from "./messages.ts";
import "./news-reminders.css";

function rememberReminder(at: number, now: number, shown: Set<number>) {
  if (shown.has(at)) return false;
  shown.add(at);
  try {
    const stored: unknown = JSON.parse(
      localStorage.getItem(SHOWN_NEWS_KEY) ?? "[]",
    );
    const upcoming = Array.isArray(stored)
      ? stored.filter(
          (time): time is number => Number.isFinite(time) && time > now,
        )
      : [];
    if (upcoming.includes(at)) return false;
    localStorage.setItem(SHOWN_NEWS_KEY, JSON.stringify([...upcoming, at]));
  } catch {
    // The in-memory set also works when browser storage is unavailable.
  }
  return true;
}

export function NewsReminderToasts() {
  const { feed, now } = useMarketCalendar();
  const { t, format } = useLocale();
  const m = useMarketMessages();
  const shown = useRef(new Set<number>());

  useEffect(() => {
    if (!feed || document.hidden) return;
    const actualNow = Date.now();
    for (const time of shown.current) {
      if (time > actualNow) continue;
      shown.current.delete(time);
      toast.remove(SHOWN_NEWS_KEY + ":" + time);
    }
    for (const [at, events] of dueNewsReminders(feed.events, actualNow)) {
      if (!rememberReminder(at, actualNow, shown.current)) continue;
      const remaining = at - actualNow;
      const title = m.reminder(
        format.integer.format(Math.ceil(remaining / MINUTE_MS)),
      );
      const extra = events.length - NEWS_TOAST_LIMIT;
      toast.custom(
        (notice) => (
          <div className="market-news-toast" data-visible={notice.visible}>
            <div className="market-news-toast-body">
              <div {...notice.ariaProps}>
                <strong>{title}</strong>
                <time dateTime={new Date(at).toISOString()}>
                  {format.clock.format(at)}
                </time>
                <ul>
                  {events.slice(0, NEWS_TOAST_LIMIT).map((event) => (
                    <li key={event.id}>
                      {event.currency} · {event.name}
                    </li>
                  ))}
                </ul>
                {extra > 0 && (
                  <small>{m.moreReleases(format.integer.format(extra))}</small>
                )}
              </div>
              <a
                className="record-link"
                href={MARKET_CALENDAR_HREF}
                onClick={() => toast.dismiss(notice.id)}
              >
                {m.openCalendar} →
              </a>
            </div>
            <button
              className="secondary market-news-dismiss"
              type="button"
              aria-label={t.close}
              onClick={() => toast.dismiss(notice.id)}
            >
              ×
            </button>
          </div>
        ),
        {
          id: SHOWN_NEWS_KEY + ":" + at,
          duration: Math.min(remaining, NEWS_TOAST_DURATION_MS),
          removeDelay: 200,
        },
      );
    }
  }, [feed, now, format, m, t.close]);

  return <Toaster position="top-right" />;
}
