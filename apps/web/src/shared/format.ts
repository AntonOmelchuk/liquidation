export function createFormatters(locale: string) {
  return {
    money: new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    percentage: new Intl.NumberFormat(locale, {
      style: "percent",
      maximumFractionDigits: 1,
    }),
    riskPercent: new Intl.NumberFormat(locale, {
      style: "percent",
      maximumFractionDigits: 4,
    }),
    day: new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeZone: "UTC",
    }),
    date: new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }),
    clock: new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }),
    integer: new Intl.NumberFormat(locale),
    price: new Intl.NumberFormat(locale, { maximumFractionDigits: 10 }),
  };
}

export function localDateTimeToIso(
  value: FormDataEntryValue | null,
  original?: string,
) {
  if (original && value === isoToLocalDateTime(original)) return original;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

export function isoToLocalDateTime(value: string) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

export function formatCompactDay(day: string) {
  const [year, month, date] = day.split("-");
  return `${date}.${month}.${year.slice(-2)}`;
}

export function numericTone(value: number) {
  return value > 0 ? "positive" : value < 0 ? "negative" : undefined;
}

export function capitalizeFirst(value: string, locale: string) {
  return value.charAt(0).toLocaleUpperCase(locale) + value.slice(1);
}
