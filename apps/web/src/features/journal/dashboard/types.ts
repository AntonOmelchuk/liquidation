import type { calendarMonth } from "@liquidation/domain/workspace/analytics";
import type { Position, Trade } from "@liquidation/domain/trades/types";
import type {
  CalendarDay,
  Preparation,
  PreparationPeriod,
} from "@liquidation/domain/workspace/types";

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
export type PreparationEditorProps = {
  preparation?: Preparation;
  kind: PreparationPeriod;
  start: string;
  onClose: (saved?: boolean) => void;
};
