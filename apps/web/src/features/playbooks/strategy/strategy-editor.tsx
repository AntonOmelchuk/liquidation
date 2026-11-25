import {
  STRATEGY_MODEL,
  STRATEGY_MODELS,
  STRATEGY_TEXT_LIMIT,
} from "@liquidation/domain/playbooks/constants";
import type { PlaybookStrategy } from "@liquidation/domain/playbooks/types";
import { calendarDate, shiftDay } from "@liquidation/domain/workspace/period";
import { LOCALES } from "../../../shared/constants.ts";
import { useLocale } from "../../../shared/messages.ts";
import { ScreenshotField } from "../../../shared/screenshots/screenshot-field.tsx";
import { SelectField } from "../../../shared/ui/select-field.tsx";
import { RuleFields, SetupFields } from "../editor/rules-editor.tsx";
import { usePlaybookMessages } from "../messages.ts";
import { useStrategyMessages } from "./messages.ts";
import { STRATEGY_MONDAY } from "./constants.ts";
import { StrategyRisk } from "./strategy-risk.tsx";
import { StrategyRows, strategyRow } from "./strategy-rows.tsx";
import { StrategySections } from "./strategy-sections.tsx";
import { StrategySymbols } from "./strategy-symbols.tsx";
import { useCommunityEditorFields } from "./community-fields.tsx";
import type { StrategyEditorProps } from "./types.ts";

export function StrategyEditor({
  strategy,
  onChange: set,
  rules,
  onRules,
  screenshots,
  onScreenshots,
}: StrategyEditorProps) {
  const s = useStrategyMessages();
  const b = usePlaybookMessages();
  const { language } = useLocale();
  const community = strategy.community;
  const weekdays = new Intl.DateTimeFormat(LOCALES[language], {
    weekday: "long",
    timeZone: "UTC",
  });

  function evidence(
    { screenshotIds }: { screenshotIds: string[] },
    update: (ids: string[]) => void,
  ) {
    return (
      <ScreenshotField
        value={screenshotIds.map((id) => screenshots.get(id) ?? { id })}
        onChange={(shots) => {
          onScreenshots(shots);
          update(shots.map(({ id }) => id));
        }}
      />
    );
  }
  const extra = useCommunityEditorFields(
    community
      ? {
          value: community,
          onChange: (value) => set("community", value),
          evidence,
        }
      : undefined,
  );

  return (
    <StrategySections
      community={Boolean(community)}
      fields={{
        ...extra,
        instruments: (
          <>
            {community && <h3>{s.primarySymbols}</h3>}
            <StrategySymbols
              symbols={strategy.symbols}
              onChange={(symbols) => set("symbols", symbols)}
            />
            {community && (
              <>
                <h3>{s.extraSymbols}</h3>
                <StrategySymbols
                  symbols={community.additionalSymbols}
                  onChange={(additionalSymbols) =>
                    set("community", { ...community, additionalSymbols })
                  }
                />
              </>
            )}
          </>
        ),
        routine: (
          <div className="layout">
            <div className="record-field-grid">
              {strategy.routine.map((notes, index) => (
                <label key={index}>
                  {weekdays.format(
                    calendarDate(shiftDay(STRATEGY_MONDAY, index)),
                  )}
                  <textarea
                    rows={2}
                    maxLength={STRATEGY_TEXT_LIMIT}
                    value={notes}
                    onChange={(event) =>
                      set(
                        "routine",
                        strategy.routine.map((value, day) =>
                          day === index ? event.target.value : value,
                        ),
                      )
                    }
                  />
                </label>
              ))}
            </div>
            <StrategyRows
              title={s.mainSessions}
              label={s.sessionName}
              detail={s.sessionHours}
              rows={strategy.mainSessions}
              create={strategyRow}
              onChange={(rows) => set("mainSessions", rows)}
            />
            <StrategyRows
              title={s.additionalSessions}
              label={s.sessionName}
              detail={s.sessionHours}
              rows={strategy.additionalSessions}
              create={strategyRow}
              onChange={(rows) => set("additionalSessions", rows)}
            />
            {community && (
              <StrategyRows
                title={s.sessionWindows}
                label={s.sessionName}
                detail={s.sessionHours}
                rows={community.sessionWindows}
                create={strategyRow}
                onChange={(sessionWindows) =>
                  set("community", { ...community, sessionWindows })
                }
              />
            )}
          </div>
        ),
        disciplines: (
          <StrategyRows
            label={s.timeframe}
            detail={s.workflow}
            rows={strategy.disciplines}
            create={() => ({ ...strategyRow(), elements: "" })}
            onChange={(rows) => set("disciplines", rows)}
            render={(row, update) => (
              <label>
                {s.elements}
                <textarea
                  rows={2}
                  maxLength={STRATEGY_TEXT_LIMIT}
                  value={row.elements}
                  onChange={(event) => update({ elements: event.target.value })}
                />
              </label>
            )}
          />
        ),
        planCriteria: (
          <StrategyRows
            label={s.criterion}
            rows={strategy.planCriteria}
            create={strategyRow}
            onChange={(rows) => set("planCriteria", rows)}
          />
        ),
        models: (
          <div className="layout">
            <StrategyRows
              label={s.modelName}
              rows={strategy.models}
              create={() => ({
                ...strategyRow(),
                category: STRATEGY_MODEL.OPERATING,
                screenshotIds: [],
              })}
              onChange={(rows) => set("models", rows)}
              render={(row, update) => (
                <>
                  <SelectField
                    label={s.modelCategory}
                    value={row.category}
                    onChange={(event) => {
                      const category = STRATEGY_MODELS.find(
                        (value) => value === event.target.value,
                      );
                      if (category) update({ category });
                    }}
                  >
                    {STRATEGY_MODELS.map((category) => (
                      <option key={category} value={category}>
                        {s[category]}
                      </option>
                    ))}
                  </SelectField>
                  {evidence(row, (screenshotIds) => update({ screenshotIds }))}
                </>
              )}
            />
            <div>
              <h3>{b.setups}</h3>
              <SetupFields
                setups={rules.setups}
                screenshots={screenshots}
                onScreenshots={onScreenshots}
                onChange={(setups) =>
                  onRules((previous) => ({ ...previous, setups }))
                }
              />
            </div>
          </div>
        ),
        entryCriteria: (
          <div className="layout">
            <div>
              <h3>{s.technical}</h3>
              <RuleFields
                rules={rules.filters}
                onChange={(filters) =>
                  onRules((previous) => ({ ...previous, filters }))
                }
              />
            </div>
            <StrategyRows
              title={s.psychological}
              label={s.criterion}
              rows={strategy.psychology}
              create={strategyRow}
              onChange={(rows) => set("psychology", rows)}
            />
          </div>
        ),
        decisions: (
          <StrategyRows<PlaybookStrategy["decisions"][number]>
            label={s.decision}
            rows={strategy.decisions}
            create={strategyRow}
            ordered
            onChange={(rows) => {
              const ids = new Set(rows.map(({ id }) => id));
              set(
                "decisions",
                rows.map((row) => ({
                  ...row,
                  onYes:
                    row.onYes && ids.has(row.onYes) ? row.onYes : undefined,
                  onNo: row.onNo && ids.has(row.onNo) ? row.onNo : undefined,
                })),
              );
            }}
            render={(row, update) => (
              <div className="strategy-branches">
                {BRANCHES.map(([key, label]) => (
                  <SelectField
                    key={key}
                    label={s[label]}
                    value={row[key] ?? ""}
                    onChange={(event) =>
                      update({ [key]: event.target.value || undefined })
                    }
                  >
                    <option value="">{s.stop}</option>
                    {strategy.decisions.map(
                      ({ id, label }, index) =>
                        id !== row.id && (
                          <option key={id} value={id}>
                            {index + 1}. {label}
                          </option>
                        ),
                    )}
                  </SelectField>
                ))}
              </div>
            )}
          />
        ),
        riskManagement: (
          <div className="layout">
            <StrategyRows
              title={s.riskRules}
              label={s.criterion}
              rows={strategy.riskRules}
              create={strategyRow}
              onChange={(rows) => set("riskRules", rows)}
            />
            <StrategyRisk
              risk={strategy.risk}
              limits={strategy.limits}
              onRisk={(risk) => set("risk", risk)}
              onLimits={(limits) => set("limits", limits)}
            />
          </div>
        ),
        management: (
          <div className="layout">
            <RuleFields
              rules={rules.management}
              onChange={(management) =>
                onRules((previous) => ({ ...previous, management }))
              }
            />
            <StrategyRows
              title={s.examples}
              label={s.example}
              rows={strategy.examples}
              create={() => ({ ...strategyRow(), screenshotIds: [] })}
              onChange={(rows) => set("examples", rows)}
              render={(row, update) =>
                evidence(row, (screenshotIds) => update({ screenshotIds }))
              }
            />
          </div>
        ),
      }}
    />
  );
}

const BRANCHES = [
  ["onYes", "yes"],
  ["onNo", "no"],
] as const;
