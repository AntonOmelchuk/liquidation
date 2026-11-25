import { STRATEGY_LIMITS } from "@liquidation/domain/playbooks/constants";
import { isNumber } from "@liquidation/domain/shared/guards";
import { calendarDate, shiftDay } from "@liquidation/domain/workspace/period";
import { LOCALES } from "../../../shared/constants.ts";
import { useLocale } from "../../../shared/messages.ts";
import { ScreenshotGallery } from "../../../shared/screenshots/screenshot-gallery.tsx";
import { useStrategyMessages } from "./messages.ts";
import { StrategyForecast } from "./strategy-risk.tsx";
import { StrategySections } from "./strategy-sections.tsx";
import type { StrategyDetailsProps } from "./types.ts";
import { StrategyRowsView } from "./strategy-rows-view.tsx";
import { StrategySymbolsView } from "./strategy-symbols.tsx";
import { useCommunityDetailFields } from "./community-fields.tsx";
import { STRATEGY_MONDAY } from "./constants.ts";

export function StrategyDetails({
  strategy,
  setups,
  technical,
  management,
}: StrategyDetailsProps) {
  const s = useStrategyMessages();
  const { language, format } = useLocale();
  const weekdays = new Intl.DateTimeFormat(LOCALES[language], {
    weekday: "long",
    timeZone: "UTC",
  });
  const limits = STRATEGY_LIMITS.filter(
    (key) => strategy.limits[key] !== undefined,
  );
  const decisionLabel = (id?: string) =>
    strategy.decisions.find((step) => step.id === id)?.label ?? s.stop;
  const community = strategy.community;
  const extra = useCommunityDetailFields(community);

  return (
    <StrategySections
      community={Boolean(community)}
      fields={{
        ...extra,
        instruments: (
          <>
            {community && <h3>{s.primarySymbols}</h3>}
            <StrategySymbolsView symbols={strategy.symbols} />
            {community && (
              <>
                <h3>{s.extraSymbols}</h3>
                <StrategySymbolsView symbols={community.additionalSymbols} />
              </>
            )}
          </>
        ),
        routine: (
          <>
            <dl className="strategy-facts">
              {strategy.routine.map(
                (text, index) =>
                  text && (
                    <div key={index}>
                      <dt>
                        {weekdays.format(
                          calendarDate(shiftDay(STRATEGY_MONDAY, index)),
                        )}
                      </dt>
                      <dd className="record-prose">{text}</dd>
                    </div>
                  ),
              )}
            </dl>
            <h3>{s.mainSessions}</h3>
            <StrategyRowsView rows={strategy.mainSessions} />
            <h3>{s.additionalSessions}</h3>
            <StrategyRowsView rows={strategy.additionalSessions} />
            {community && (
              <>
                <h3>{s.sessionWindows}</h3>
                <StrategyRowsView rows={community.sessionWindows} />
              </>
            )}
          </>
        ),
        disciplines: (
          <StrategyRowsView
            rows={strategy.disciplines}
            extra={(index) => (
              <p className="record-prose">
                {strategy.disciplines[index].elements}
              </p>
            )}
          />
        ),
        planCriteria: <StrategyRowsView rows={strategy.planCriteria} />,
        models: (
          <>
            <StrategyRowsView
              rows={strategy.models}
              extra={(index) => {
                const model = strategy.models[index];
                return (
                  <>
                    <p>{s[model.category]}</p>
                    <ScreenshotGallery ids={model.screenshotIds} />
                  </>
                );
              }}
            />
            {setups}
          </>
        ),
        entryCriteria: (
          <>
            <h3>{s.technical}</h3>
            {technical}
            <h3>{s.psychological}</h3>
            <StrategyRowsView rows={strategy.psychology} />
          </>
        ),
        decisions: (
          <StrategyRowsView
            rows={strategy.decisions}
            ordered
            extra={(index) => {
              const step = strategy.decisions[index];
              return (
                <dl className="strategy-facts">
                  <div>
                    <dt>{s.yes}</dt>
                    <dd>{decisionLabel(step.onYes)}</dd>
                  </div>
                  <div>
                    <dt>{s.no}</dt>
                    <dd>{decisionLabel(step.onNo)}</dd>
                  </div>
                </dl>
              );
            }}
          />
        ),
        riskManagement: (
          <>
            <StrategyForecast risk={strategy.risk} />
            {limits.length > 0 && (
              <dl className="strategy-facts">
                {limits.map((key) => {
                  const value = strategy.limits[key];
                  return (
                    <div key={key}>
                      <dt>{s[key]}</dt>
                      <dd>
                        {isNumber(value) ? format.price.format(value) : value}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            )}
            <h3>{s.riskRules}</h3>
            <StrategyRowsView rows={strategy.riskRules} />
          </>
        ),
        management: (
          <>
            {management}
            <h3>{s.examples}</h3>
            <StrategyRowsView
              rows={strategy.examples}
              extra={(index) => (
                <ScreenshotGallery
                  ids={strategy.examples[index].screenshotIds}
                />
              )}
            />
          </>
        ),
      }}
    />
  );
}
