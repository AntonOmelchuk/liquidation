import { useId } from "react";
import type { InfoTipProps } from "./types.ts";

export function InfoTip({ label, text }: InfoTipProps) {
  const id = useId();
  return (
    <span className="info-tip">
      <button type="button" aria-label={label} aria-describedby={id}>
        i
      </button>
      <span className="info-tip-content" id={id} role="tooltip">
        {text}
      </span>
    </span>
  );
}
