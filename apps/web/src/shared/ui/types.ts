import type { PlanSetup } from "@liquidation/domain/plans/types";
import type { TradeDirection } from "@liquidation/domain/trades/types";
import type { ComponentProps, ReactNode } from "react";

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
  ComponentProps<"input">,
  "type" | "children"
> & {
  children?: ReactNode;
};

export type PanelProps = {
  id?: string;
  title: string;
  detail?: ReactNode;
  children: ReactNode;
};

export type MetricProps = {
  label: string;
  value: string;
  detail?: string;
};

export type RecordActionsProps = {
  backHref: string;
  cancel: string;
  submit: string;
  saving: boolean;
  error?: string;
};

export type InfoTipProps = { label: string; text: string };
