import { NEWS_REMINDER_WINDOW_MS } from "@liquidation/domain/market/constants";
import {
  instrumentNewsCurrencies,
  scheduledReleaseTime,
} from "@liquidation/domain/market/news-reminders";
import { useLocale } from "../../shared/messages.ts";
import { useMarketCalendar } from "./calendar-context.tsx";
import { MARKET_CALENDAR_HREF } from "./constants.ts";
import { useMarketMessages } from "./messages.ts";

export function PositionNewsBadge({ symbol }: { symbol: string }) {
  const { upcoming, now } = useMarketCalendar();
  const m = useMarketMessages();
  const { format } = useLocale();
  const events = instrumentNewsCurrencies(symbol)
    .flatMap((currency) => upcoming.get(currency) ?? [])
    .map((event) => ({ event, time: scheduledReleaseTime(event) }))
    .sort((a, b) => (a.time ?? Infinity) - (b.time ?? Infinity));
  if (!events.length) return null;

  const next = events[0];
  const scheduled =
    next.time === null
      ? next.event.allDayOn
        ? m.allDay
        : m.timePending
      : format.clock.format(next.time);
  const description = events
    .map(({ event, time }) => {
      const moment =
        time === null
          ? event.allDayOn
            ? m.allDay
            : m.timePending
          : format.clock.format(time);
      return moment + " · " + event.currency + " · " + event.name;
    })
    .join("\n");

  return (
    <a
      className="position-news-badge"
      data-imminent={
        next.time !== null && next.time - now <= NEWS_REMINDER_WINDOW_MS
      }
      href={MARKET_CALENDAR_HREF}
      title={description}
      aria-label={m.positionNews + " · " + description}
      onClick={(event) => event.stopPropagation()}
    >
      {m.positionNewsShort} · {scheduled}
    </a>
  );
}
