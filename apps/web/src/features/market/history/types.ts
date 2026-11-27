import type {
  ForecastReactionGroup,
  ForecastResult,
  ReleaseSeries,
} from "@liquidation/domain/market/types";
import type { NEWS_COLUMN } from "./constants.ts";

export type NewsColumn = (typeof NEWS_COLUMN)[keyof typeof NEWS_COLUMN];
export type NewsTableProps = { series: ReleaseSeries[] };
export type NewsReleaseDetailProps = {
  series: ReleaseSeries;
  close: () => void;
};
export type ForecastBreakdownProps = {
  groups: readonly ForecastReactionGroup[];
  active?: ForecastResult;
  onSelect: (result: ForecastResult | undefined) => void;
  detailId: string;
};
