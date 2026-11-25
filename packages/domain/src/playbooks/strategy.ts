import { z } from "zod";
import { screenshotIdsSchema } from "../evidence/screenshots.ts";
import { instrumentSymbolSchema } from "../instruments/symbol.ts";
import {
  STRATEGY_MODELS,
  PLAYBOOK_TEMPLATE,
  STRATEGY_RISK_DEFAULTS,
  STRATEGY_RISK_INPUTS,
  STRATEGY_ROW_LIMIT,
  STRATEGY_SHORT_LIMIT,
  STRATEGY_TEXT_LIMIT,
  STRATEGY_WEEKDAYS,
  TRADE_FREQUENCIES,
  TRADE_FREQUENCY,
} from "./constants.ts";
import type {
  PlaybookStrategy,
  PlaybookTemplate,
  StrategyRiskInputs,
} from "./types.ts";

const detail = z.string().trim().max(STRATEGY_TEXT_LIMIT);
const row = z.object({
  id: z.uuid(),
  label: z.string().trim().min(1).max(STRATEGY_SHORT_LIMIT),
  detail,
});
const evidence = row.extend({ screenshotIds: screenshotIdsSchema });
const decision = row.extend({
  onYes: z.uuid().optional(),
  onNo: z.uuid().optional(),
});
const list = <T extends typeof row>(schema: T) =>
  z
    .array(schema)
    .max(STRATEGY_ROW_LIMIT)
    .refine(
      (rows) => new Set(rows.map(({ id }) => id)).size === rows.length,
      "Duplicate row ID.",
    );
const number = (key: keyof typeof STRATEGY_RISK_INPUTS) => {
  const { min, max, step } = STRATEGY_RISK_INPUTS[key];
  const schema = z.number().min(min).max(max);
  return step === 1 ? schema.int() : schema;
};
export const strategyRiskSchema = z
  .object({
    capital: number("capital"),
    tradeCount: number("tradeCount"),
    frequency: z.enum(TRADE_FREQUENCIES),
    monthsOff: number("monthsOff"),
    months: number("months"),
    winPercent: number("winPercent"),
    rewardR: number("rewardR"),
    riskPercent: number("riskPercent"),
  })
  .refine(
    ({ months, monthsOff }) => monthsOff <= months,
    "Time off exceeds the forecast period.",
  );

const percent = z.number().min(0).max(100).optional();
const strategyLimits = z
  .object({
    standardRisk: percent,
    reducedRisk: percent,
    dailyTarget: percent,
    weeklyTarget: percent,
    monthlyTargetLow: percent,
    monthlyTargetHigh: percent,
    intradayRR: z.string().trim().max(40).optional(),
    maxDailyLoss: percent,
    maxWeeklyLoss: percent,
  })
  .refine(
    ({ monthlyTargetLow, monthlyTargetHigh }) =>
      monthlyTargetLow === undefined ||
      monthlyTargetHigh === undefined ||
      monthlyTargetLow <= monthlyTargetHigh,
    "Minimum target exceeds maximum target.",
  );

const communitySchema = z.object({
  scope: z.string().trim().max(4000),
  additionalSymbols: z
    .array(instrumentSymbolSchema)
    .max(STRATEGY_ROW_LIMIT)
    .refine((symbols) => symbols.length === new Set(symbols).size),
  sessionWindows: list(row),
  directionCriteria: list(row),
  principles: list(row),
  chartExamples: list(evidence),
  journalRoutine: list(row),
  tools: list(row),
  selfChecks: list(row),
  emotions: list(row),
  cases: list(evidence),
});

export const playbookStrategySchema = z.object({
  symbols: z
    .array(instrumentSymbolSchema)
    .max(STRATEGY_ROW_LIMIT)
    .refine((symbols) => new Set(symbols).size === symbols.length),
  routine: z.array(detail).length(STRATEGY_WEEKDAYS),
  mainSessions: list(row),
  additionalSessions: list(row),
  disciplines: list(row.extend({ elements: detail })),
  planCriteria: list(row),
  models: list(evidence.extend({ category: z.enum(STRATEGY_MODELS) })),
  psychology: list(row),
  decisions: list(decision).refine((steps) => {
    const ids = new Set(steps.map(({ id }) => id));
    return steps.every(({ id, onYes, onNo }) =>
      [onYes, onNo].every(
        (next) => next === undefined || (next !== id && ids.has(next)),
      ),
    );
  }, "Decision branches must point to another saved step."),
  riskRules: list(row),
  risk: strategyRiskSchema,
  limits: strategyLimits,
  examples: list(evidence),
  community: communitySchema.optional(),
});

export function getPlaybookTemplate(
  strategy?: PlaybookStrategy,
): PlaybookTemplate {
  return strategy?.community
    ? PLAYBOOK_TEMPLATE.COMMUNITY
    : strategy
      ? PLAYBOOK_TEMPLATE.STRATEGY
      : PLAYBOOK_TEMPLATE.STANDARD;
}

export function strategyScreenshotIds(strategy?: PlaybookStrategy) {
  if (!strategy) return [];
  return [
    ...strategy.models,
    ...strategy.examples,
    ...(strategy.community?.chartExamples ?? []),
    ...(strategy.community?.cases ?? []),
  ].flatMap(({ screenshotIds }) => screenshotIds);
}

export function emptyPlaybookStrategy(
  template: PlaybookTemplate = PLAYBOOK_TEMPLATE.STRATEGY,
) {
  return playbookStrategySchema.parse({
    symbols: [],
    routine: Array.from({ length: STRATEGY_WEEKDAYS }, () => ""),
    mainSessions: [],
    additionalSessions: [],
    disciplines: [],
    planCriteria: [],
    models: [],
    psychology: [],
    decisions: [],
    riskRules: [],
    risk: STRATEGY_RISK_DEFAULTS,
    limits: {},
    examples: [],
    community:
      template === PLAYBOOK_TEMPLATE.COMMUNITY
        ? {
            scope: "",
            additionalSymbols: [],
            sessionWindows: [],
            directionCriteria: [],
            principles: [],
            chartExamples: [],
            journalRoutine: [],
            tools: [],
            selfChecks: [],
            emotions: [],
            cases: [],
          }
        : undefined,
  });
}

export function forecastStrategy({
  capital,
  tradeCount,
  frequency,
  monthsOff,
  months,
  winPercent,
  rewardR,
  riskPercent,
}: StrategyRiskInputs) {
  const trades = Math.round(
    tradeCount *
      (months - monthsOff) *
      (frequency === TRADE_FREQUENCY.WEEK ? 52 / 12 : 1),
  );
  const winRate = winPercent / 100;
  const wins = Math.round(trades * winRate);
  const expectancyR = winRate * rewardR - (1 - winRate);
  const returnRate = trades * expectancyR * (riskPercent / 100);
  return {
    trades,
    wins,
    losses: trades - wins,
    expectancyR,
    returnRate,
    capital: capital * (1 + returnRate),
  };
}
