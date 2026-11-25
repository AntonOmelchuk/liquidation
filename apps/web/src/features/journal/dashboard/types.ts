import type { calendarMonth } from "@liquidation/domain/workspace/analytics";
import type { Trade } from "@liquidation/domain/trades/types";
import type {
  Preparation,
  PreparationPeriod,
} from "@liquidation/domain/workspace/types";

export type CalendarProps = {
  trades: readonly Trade[];
  initialMonth: string;
  today: string;
};
export type DailyPnlProps = { days: ReturnType<typeof calendarMonth>["days"] };
export type PreparationEditorProps = {
  preparation?: Preparation;
  kind: PreparationPeriod;
  start: string;
  onClose: (saved?: boolean) => void;
};
