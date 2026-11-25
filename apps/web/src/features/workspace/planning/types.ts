import type {
  DailyThought,
  MissedTrade,
  WeeklyWatchlist,
  WatchItem,
} from "@liquidation/domain/workspace/types";
import type { ScreenshotDraft } from "../../../shared/screenshots/types.ts";

export type ThoughtEditorProps = {
  day: string;
  entry?: DailyThought;
  onClose: () => void;
};
export type WatchDraft = Omit<WatchItem, "screenshotIds"> & {
  images: ScreenshotDraft[];
};
export type WatchlistEditorProps = {
  week: string;
  entry?: WeeklyWatchlist;
  onClose: () => void;
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
};
export type MissedEditorProps = {
  entry?: MissedTrade;
  initialDay?: string;
  onClose: () => void;
};
