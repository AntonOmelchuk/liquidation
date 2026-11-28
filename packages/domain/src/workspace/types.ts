import type { Trade, Position } from "../trades/types.ts";
import type { Plan } from "../plans/types.ts";
import type { z } from "zod";
import type {
  MISSED_REASONS,
  PREPARATION_PERIODS,
  PERIODS,
} from "./constants.ts";
import type { lectureBlockSchema } from "./learning.ts";
import type { workspaceCommand, workspaceSchema } from "./workspace.ts";

export type ReviewPeriod = (typeof PERIODS)[number];
export type PreparationPeriod = (typeof PREPARATION_PERIODS)[number];
export type Workspace = z.infer<typeof workspaceSchema>;
export type WorkspaceCommand = z.infer<typeof workspaceCommand>;
export type Preparation = Workspace["preparations"][number];
export type Report = Workspace["reports"][number];
export type LearningEntry = Workspace["learning"][number];
export type LearningKind = LearningEntry["kind"];
export type LearningTopic = NonNullable<LearningEntry["topic"]>;
export type LectureBlock = z.infer<typeof lectureBlockSchema>;
export type Highlight = Workspace["highlights"][number];
export type HighlightDetails = NonNullable<Highlight["details"]>;
export type DailyThought = Workspace["thoughts"][number];
export type WeeklyWatchlist = Workspace["watchlists"][number];
export type WatchItem = WeeklyWatchlist["items"][number];
export type MissedTrade = Workspace["missedTrades"][number];
export type MissedReason = (typeof MISSED_REASONS)[number];

export type WatchlistActivitySource = {
  trades: readonly Trade[];
  positions: readonly Position[];
  missedTrades: readonly MissedTrade[];
  plans: readonly Plan[];
};

export type WatchlistActivityIndex = {
  trades: ReadonlyMap<string, Trade[]>;
  positions: ReadonlyMap<string, Position[]>;
  missedTrades: ReadonlyMap<string, MissedTrade[]>;
  plans: ReadonlyMap<string, Plan>;
};

export type CalendarDay = {
  trades: Trade[];
  positions: Position[];
  net: number;
  wins: number;
};

export type ReviewPeriodIndexSource = {
  trades: readonly Trade[];
  positions: readonly Position[];
  reports: readonly Report[];
};
