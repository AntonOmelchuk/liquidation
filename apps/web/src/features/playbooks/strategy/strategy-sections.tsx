import { useId } from "react";
import { Panel } from "../../../shared/ui/layout.tsx";
import { COMMUNITY_SECTIONS, STRATEGY_SECTIONS } from "./constants.ts";
import { useStrategyMessages } from "./messages.ts";
import type { StrategyContentProps } from "./types.ts";
import "./strategy.css";

export function StrategySections({ fields, community }: StrategyContentProps) {
  const s = useStrategyMessages();
  const prefix = useId();
  const sectionId = (key: string) => prefix + key;
  const sections = community ? COMMUNITY_SECTIONS : STRATEGY_SECTIONS;
  return (
    <div className="strategy-sections">
      <nav className="strategy-index" aria-label={s.sections}>
        {sections.map((key) => (
          <button
            className="secondary"
            type="button"
            key={key}
            onClick={() => {
              const section = document.getElementById(sectionId(key));
              section?.scrollIntoView({ block: "start" });
              section?.focus({ preventScroll: true });
            }}
          >
            {s[key]}
          </button>
        ))}
      </nav>
      <div className="layout">
        {sections.map((key) => (
          <div
            key={key}
            id={sectionId(key)}
            tabIndex={-1}
            className="strategy-section"
          >
            <Panel title={s[key]}>{fields[key]}</Panel>
          </div>
        ))}
      </div>
    </div>
  );
}
