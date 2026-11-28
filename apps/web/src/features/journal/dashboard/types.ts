import type { calendarMonth } from "@liquidation/domain/workspace/analytics";
import type { Position, Trade } from "@liquidation/domain/trades/types";
import type { CalendarDay } from "@liquidation/domain/workspace/types";

export type CalendarProps = {
  trades: readonly Trade[];
  positions: readonly Position[];
  initialMonth: string;
  today: string;
};
export type CalendarTradePreviewProps = {
  id: string;
  day: CalendarDay;
  money: Intl.NumberFormat;
};
export type DailyPnlProps = { days: ReturnType<typeof calendarMonth>["days"] };
