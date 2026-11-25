import type {
  PlaybookRules,
  CommunityStrategy,
  PlaybookStrategy,
  StrategyRiskInputs,
  StrategyRow,
} from "@liquidation/domain/playbooks/types";
import type { ReactNode } from "react";
import type { ScreenshotDraft } from "../../../shared/screenshots/types.ts";
import type { COMMUNITY_SECTIONS, STRATEGY_SECTIONS } from "./constants.ts";

export type StrategySection = (typeof COMMUNITY_SECTIONS)[number];
export type StrategyFieldMap = Record<
  (typeof STRATEGY_SECTIONS)[number],
  ReactNode
> &
  Partial<Record<StrategySection, ReactNode>>;
export type StrategyContentProps = {
  fields: StrategyFieldMap;
  community?: boolean;
};
export type CommunityFieldsProps = {
  value: CommunityStrategy;
  onChange: (value: CommunityStrategy) => void;
  evidence: (
    row: { screenshotIds: string[] },
    update: (ids: string[]) => void,
  ) => ReactNode;
};
export type SymbolListProps = {
  symbols: string[];
  onChange: (symbols: string[]) => void;
};
export type StrategyEditorProps = {
  strategy: PlaybookStrategy;
  onChange: <K extends keyof PlaybookStrategy>(
    key: K,
    value: PlaybookStrategy[K],
  ) => void;
  rules: PlaybookRules;
  onRules: (update: (rules: PlaybookRules) => PlaybookRules) => void;
  screenshots: ReadonlyMap<string, ScreenshotDraft>;
  onScreenshots: (shots: ScreenshotDraft[]) => void;
};
export type StrategyRowsProps<T extends StrategyRow> = {
  title?: string;
  rows: T[];
  onChange: (rows: T[]) => void;
  create: () => T;
  label: string;
  detail?: string;
  ordered?: boolean;
  render?: (row: T, update: (patch: Partial<T>) => void) => ReactNode;
};
export type StrategyRiskProps = {
  risk: StrategyRiskInputs;
  limits: PlaybookStrategy["limits"];
  onRisk: (risk: StrategyRiskInputs) => void;
  onLimits: (limits: PlaybookStrategy["limits"]) => void;
};
export type StrategyDetailsProps = {
  strategy: PlaybookStrategy;
  setups: ReactNode;
  technical: ReactNode;
  management: ReactNode;
};
export type StrategyRowsViewProps = {
  rows: StrategyRow[];
  extra?: (index: number) => ReactNode;
  ordered?: boolean;
};
