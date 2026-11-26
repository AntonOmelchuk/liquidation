import type { WORKSPACE_SAVE } from "./constants.ts";
import type { PreparationPeriod } from "@liquidation/domain/workspace/types";

export type WorkspaceSaveStatus =
  (typeof WORKSPACE_SAVE)[keyof typeof WORKSPACE_SAVE];

export type PeriodSwitcherProps = {
  period: PreparationPeriod;
  onChange: (period: PreparationPeriod) => void;
  disabled?: boolean;
  relative?: boolean;
};
