export function isReviewTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function createReviewCalendar(timeZone: string) {
  const clock = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  });

  function at(iso: string) {
    const parts = Object.fromEntries(
      clock
        .formatToParts(new Date(iso))
        .map(({ type, value }) => [type, value]),
    );
    const month = `${parts.year.padStart(4, "0")}-${parts.month}`;
    const day = `${month}-${parts.day}`;
    return { day, month, hour: Number(parts.hour) };
  }

  return at;
}

export function recentReviewDates(
  timeZone: string,
  days: number,
  now = new Date(),
) {
  const through = createReviewCalendar(timeZone)(now.toISOString()).day;
  const firstDay = new Date(`${through}T12:00:00Z`);
  firstDay.setUTCDate(firstDay.getUTCDate() - days + 1);
  return { from: firstDay.toISOString().slice(0, 10), through };
}

export function entryWeekday(day: string) {
  return new Date(`${day}T12:00:00Z`).getUTCDay() || 7;
}
