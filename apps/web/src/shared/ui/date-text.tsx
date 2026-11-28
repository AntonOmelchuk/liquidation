import { localDay } from "@liquidation/domain/workspace/period";
import { formatCompactDay } from "../format.ts";
import { useLocale } from "../messages.ts";
import type { DateTextProps } from "./types.ts";

export function DateText({ value, withTime, className }: DateTextProps) {
  const { format } = useLocale();
  const hasTime = value.length > 10;
  const full = hasTime ? format.date.format(Date.parse(value)) : undefined;
  const day = hasTime ? localDay(value) : value;
  return (
    <time
      className={className ? "date-text " + className : "date-text"}
      dateTime={value}
      title={withTime ? undefined : full}
    >
      {withTime && full ? full : formatCompactDay(day)}
    </time>
  );
}
