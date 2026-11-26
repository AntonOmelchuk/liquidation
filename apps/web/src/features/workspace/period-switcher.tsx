import {
  PERIOD,
  PREPARATION_PERIODS,
} from "@liquidation/domain/workspace/constants";
import { useWorkspaceMessages } from "./messages.ts";
import type { PeriodSwitcherProps } from "./types.ts";

export function PeriodSwitcher({
  period,
  onChange,
  disabled,
  relative,
}: PeriodSwitcherProps) {
  const m = useWorkspaceMessages();
  const labels = {
    [PERIOD.DAY]: relative ? m.today : m.dayTab,
    [PERIOD.WEEK]: relative ? m.thisWeek : m.weekTab,
  };
  return (
    <div
      className="workspace-actions"
      role="group"
      aria-label={m.periodSelection}
    >
      {PREPARATION_PERIODS.map((value) => (
        <button
          key={value}
          type="button"
          className="secondary"
          aria-pressed={value === period}
          disabled={disabled}
          onClick={() => onChange(value)}
        >
          {labels[value]}
        </button>
      ))}
    </div>
  );
}
