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
    day: new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeZone: "UTC",
    }),
    date: new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }),
    integer: new Intl.NumberFormat(locale),
    price: new Intl.NumberFormat(locale, { maximumFractionDigits: 10 }),
  };
}

export function localDateTimeToIso(value: FormDataEntryValue | null) {
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

export function isoToLocalDateTime(value: string) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

export function numericTone(value: number) {
  return value > 0 ? "positive" : value < 0 ? "negative" : undefined;
}
