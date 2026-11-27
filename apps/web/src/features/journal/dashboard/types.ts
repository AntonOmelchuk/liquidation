import type { calendarMonth } from "@liquidation/domain/workspace/analytics";
import type { Position, Trade } from "@liquidation/domain/trades/types";
import type { CalendarDay } from "@liquidation/domain/workspace/types";
import type { TradeStatistics } from "@liquidation/domain/analytics/types";
import type { ReactNode } from "react";
import type { numericTone } from "../../../shared/format.ts";
import type { CHART_TONE } from "./constants.ts";

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

export type DashboardMetricsProps = {
  stats: TradeStatistics;
  values: readonly number[];
  ready: boolean;
};
export type DashboardMetricProps = {
  label: string;
  value: string;
  tone?: ReturnType<typeof numericTone>;
  featured?: boolean;
  children?: ReactNode;
  detail?: ReactNode;
};
export type GaugeSegment = {
  tone: (typeof CHART_TONE)[keyof typeof CHART_TONE];
  value: number;
};
export type SegmentedGaugeProps = {
  segments: readonly GaugeSegment[];
  label: string;
  semicircle?: boolean;
};
