import { localDay } from "@liquidation/domain/workspace/period";

export function createFormatters(locale: string) {
  const clock = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const day = (value: Date | number) =>
    formatCompactDay(new Date(value).toISOString().slice(0, 10));

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
    day: {
      format: day,
      formatRange(start: Date | number, end: Date | number) {
        const from = day(start);
        const through = day(end);
        return from === through ? from : `${from} – ${through}`;
      },
    },
    date: {
      format: (value: Date | number) =>
        formatCompactDateTime(new Date(value).toISOString(), clock),
    },
    clock,
    integer: new Intl.NumberFormat(locale),
    price: new Intl.NumberFormat(locale, { maximumFractionDigits: 10 }),
  };
}

export function createCurrencyFormatter(
  locale: string,
  currency: string,
  options?: Intl.NumberFormatOptions,
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  });
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
  return `${date}.${month}.${year}`;
}

export function formatCompactDateTime(iso: string, clock: Intl.DateTimeFormat) {
  return `${formatCompactDay(localDay(iso))} · ${clock.format(Date.parse(iso))}`;
}

export function numericTone(value: number) {
  return value > 0 ? "positive" : value < 0 ? "negative" : undefined;
}

export function capitalizeFirst(value: string, locale: string) {
  return value.charAt(0).toLocaleUpperCase(locale) + value.slice(1);
}
