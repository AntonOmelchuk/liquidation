import type { PlanSetup } from "@liquidation/domain/plans/types";
import type { TradeDirection } from "@liquidation/domain/trades/types";
import type {
  ComponentProps,
  ComponentPropsWithoutRef,
  ReactNode,
} from "react";
import type { METRIC_ICON, METRIC_TONE } from "./metric-constants.ts";
import type { ICON_ACTION } from "./constants.ts";

export type DirectionBadgeProps = {
  direction: TradeDirection | NonNullable<PlanSetup["narrative"]>;
  children: ReactNode;
};

export type TradeSideBadgeProps = { side: TradeDirection };

export type InstrumentIconsProps = { symbol: string };

export type InstrumentPickerProps = {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  label?: string;
};

export type SelectFieldProps = ComponentProps<"select"> & {
  label: string;
  children: ReactNode;
};

export type CheckboxFieldProps = Omit<
  ComponentPropsWithoutRef<"input">,
  "type" | "children"
> & {
  children?: ReactNode;
  indeterminate?: boolean;
};

export type PanelProps = {
  id?: string;
  title: string;
  detail?: ReactNode;
  children: ReactNode;
};

export type MetricTone = (typeof METRIC_TONE)[keyof typeof METRIC_TONE];
export type MetricCardProps = {
  label: string;
  value: string;
  detail?: ReactNode;
  tone?: MetricTone;
  icon?: keyof typeof METRIC_ICON;
  featured?: boolean;
  children?: ReactNode;
};

export type MetricGridProps = {
  label?: string;
  compact?: boolean;
  children: ReactNode;
};

export type MetricPart = {
  tone: MetricTone;
  label: string;
  value: number;
  text: string;
};
export type MetricFigure = readonly [
  tone: MetricTone,
  label: string,
  value: number | null,
];
export type MetricPartsProps = {
  parts: readonly MetricPart[];
};

export type MetricBarProps = {
  label?: string;
  segments: readonly {
    tone: MetricTone;
    ratio: number;
  }[];
};

export type RecordActionsProps = {
  backHref: string;
  cancel: string;
  submit: string;
  saving: boolean;
  error?: string;
};

export type InfoTipProps = { label: string; text: string };

export type DateTextProps = {
  value: string;
  withTime?: boolean;
  className?: string;
};

export type IconActionProps = {
  icon: (typeof ICON_ACTION)[keyof typeof ICON_ACTION];
  label: string;
} & (
  | ({ href: string } & Pick<ComponentProps<"a">, "onClick">)
  | ({
      href?: never;
    } & Pick<
      ComponentProps<"button">,
      "onClick" | "disabled" | "aria-haspopup"
    >)
);

export type RecordTableProps = { label: string; children: ReactNode };

export type RecordHeadingProps = {
  title: ReactNode;
  backHref: string;
  backLabel: string;
  meta?: ReactNode;
  actions?: ReactNode;
};
