import { PLAN_NARRATIVE } from "@liquidation/domain/plans/constants";
import { useLocale } from "../messages.ts";
import type { DirectionBadgeProps, TradeSideBadgeProps } from "./types.ts";
import "./direction-badge.css";

export function DirectionBadge({ direction, children }: DirectionBadgeProps) {
  const flat =
    direction === PLAN_NARRATIVE.NEUTRAL ||
    direction === PLAN_NARRATIVE.NO_TRADE;

  return (
    <span className="direction-badge" data-direction={direction}>
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d={flat ? "M3.5 8h9" : "M2.25 11.5 6 7.75l2.5 2.5 5.25-5.5m-4 0h4v4"}
        />
      </svg>
      {children}
    </span>
  );
}

export function TradeSideBadge({ side }: TradeSideBadgeProps) {
  const { t } = useLocale();
  return <DirectionBadge direction={side}>{t[side]}</DirectionBadge>;
}
