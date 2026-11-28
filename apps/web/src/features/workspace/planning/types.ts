import type {
  DailyThought,
  MissedTrade,
  Preparation,
  PreparationPeriod,
  WeeklyWatchlist,
  WatchItem,
} from "@liquidation/domain/workspace/types";
import type { ScreenshotDraft } from "../../../shared/screenshots/types.ts";

export type PeriodThoughtsPanelProps = {
  period: PreparationPeriod;
  day: string;
  onPeriodChange: (period: PreparationPeriod) => void;
  onDayChange?: (day: string) => void;
};
export type PeriodThoughtsEditorProps = {
  period: PreparationPeriod;
  start: string;
  preparation?: Preparation;
  legacy?: DailyThought;
  onClose: () => void;
};
export type WatchDraft = Omit<WatchItem, "screenshotIds"> & {
  images: ScreenshotDraft[];
};
export type WatchlistEditorProps = {
  week: string;
  entry?: WeeklyWatchlist;
  onClose: (saved?: boolean) => void;
};
export type WatchItemEditorProps = {
  week: string;
  item: WatchDraft;
  onChange: (next: WatchDraft) => void;
  onRemove: () => void;
  disabled: boolean;
};
export type MissedTradesPanelProps = {
  from?: string;
  through?: string;
  initialDay?: string;
  showBreakdown?: boolean;
};
export type MissedEditorProps = {
  entry?: MissedTrade;
  initialDay?: string;
  onClose: (savedId?: string) => void;
};

export type MissedTradesTableProps = {
  records: readonly MissedTrade[];
  executed: ReadonlySet<string>;
};
