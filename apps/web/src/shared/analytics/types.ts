import type { SORT_DIRECTION } from "./constants.ts";

export type DateRange = { from: string; through: string };
export type SortDirection =
  (typeof SORT_DIRECTION)[keyof typeof SORT_DIRECTION];
export type SortState<Column extends string> = {
  column: Column;
  direction: SortDirection;
};
export type SortValue = string | number | null;
export type AnalyticsOption = { key: string; label: string };

export type AnalyticsSelectProps = {
  label: string;
  title?: string;
  all: string;
  value?: string;
  options: readonly AnalyticsOption[];
  onChange: (value: string | undefined) => void;
};

export type DateRangeFieldsProps = {
  range: DateRange;
  fromLabel: string;
  throughLabel: string;
  invalid: boolean;
  hintId?: string;
  onChange: (range: DateRange) => void;
};

export type FactorButtonsProps<Factor extends string> = {
  label: string;
  value: Factor;
  options: readonly (AnalyticsOption & { key: Factor })[];
  onChange: (value: Factor) => void;
};

export type SortableHeaderProps = {
  label: string;
  direction?: SortDirection;
  onSort: () => void;
  title?: string;
};

export type SeriesChartProps = {
  compact?: boolean;
  signed?: boolean;
  values: readonly number[];
  label: string;
  empty: string;
  unit?: string;
};
