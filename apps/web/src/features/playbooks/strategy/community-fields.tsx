import { COMMUNITY_SOURCE } from "@liquidation/domain/playbooks/constants";
import type { CommunityStrategy } from "@liquidation/domain/playbooks/types";
import { ScreenshotGallery } from "../../../shared/screenshots/screenshot-gallery.tsx";
import { useStrategyMessages } from "./messages.ts";
import { StrategyRows, strategyRow } from "./strategy-rows.tsx";
import { StrategyRowsView } from "./strategy-rows-view.tsx";
import type { CommunityFieldsProps, StrategyFieldMap } from "./types.ts";

function SourceLink() {
  const s = useStrategyMessages();
  return (
    <a
      className="record-link"
      href={COMMUNITY_SOURCE}
      target="_blank"
      rel="noreferrer"
    >
      {s.sourceTemplate} ↗
    </a>
  );
}

export function useCommunityEditorFields(
  props?: CommunityFieldsProps,
): Partial<StrategyFieldMap> {
  const s = useStrategyMessages();
  if (!props) return {};
  const { value, onChange, evidence } = props;
  const set = <K extends keyof CommunityStrategy>(
    key: K,
    next: CommunityStrategy[K],
  ) => onChange({ ...value, [key]: next });
  function rows(
    key:
      | "directionCriteria"
      | "principles"
      | "journalRoutine"
      | "tools"
      | "selfChecks"
      | "emotions",
  ) {
    return (
      <StrategyRows
        label={s.criterion}
        rows={value[key]}
        create={strategyRow}
        onChange={(items) => set(key, items)}
      />
    );
  }
  function illustrations(key: "chartExamples" | "cases") {
    return (
      <StrategyRows
        label={s.example}
        rows={value[key]}
        create={() => ({ ...strategyRow(), screenshotIds: [] })}
        onChange={(items) => set(key, items)}
        render={(row, update) =>
          evidence(row, (screenshotIds) => update({ screenshotIds }))
        }
      />
    );
  }
  return {
    scope: (
      <div className="layout">
        <SourceLink />
        <label>
          {s.scope}
          <textarea
            rows={5}
            maxLength={4000}
            value={value.scope}
            onChange={(event) => set("scope", event.target.value)}
          />
        </label>
      </div>
    ),
    directionCriteria: rows("directionCriteria"),
    principles: rows("principles"),
    chartExamples: illustrations("chartExamples"),
    journalRoutine: rows("journalRoutine"),
    tools: rows("tools"),
    selfChecks: (
      <div className="layout">
        <div>
          <h3>{s.selfAssessment}</h3>
          {rows("selfChecks")}
        </div>
        <div>
          <h3>{s.emotions}</h3>
          {rows("emotions")}
        </div>
        <div>
          <h3>{s.cases}</h3>
          {illustrations("cases")}
        </div>
      </div>
    ),
  };
}

export function useCommunityDetailFields(
  value?: CommunityStrategy,
): Partial<StrategyFieldMap> {
  const s = useStrategyMessages();
  if (!value) return {};
  function illustrations(key: "chartExamples" | "cases") {
    const rows = value![key];
    return (
      <StrategyRowsView
        rows={rows}
        extra={(index) => <ScreenshotGallery ids={rows[index].screenshotIds} />}
      />
    );
  }
  return {
    scope: (
      <>
        <SourceLink />
        {value.scope ? (
          <p className="record-prose">{value.scope}</p>
        ) : (
          <p>{s.empty}</p>
        )}
      </>
    ),
    directionCriteria: <StrategyRowsView rows={value.directionCriteria} />,
    principles: <StrategyRowsView rows={value.principles} />,
    chartExamples: illustrations("chartExamples"),
    journalRoutine: <StrategyRowsView rows={value.journalRoutine} />,
    tools: <StrategyRowsView rows={value.tools} />,
    selfChecks: (
      <>
        <h3>{s.selfAssessment}</h3>
        <StrategyRowsView rows={value.selfChecks} />
        <h3>{s.emotions}</h3>
        <StrategyRowsView rows={value.emotions} />
        <h3>{s.cases}</h3>
        {illustrations("cases")}
      </>
    ),
  };
}
