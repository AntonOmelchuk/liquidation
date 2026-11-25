import type { BacktestCommand } from "@liquidation/domain/backtests/types";
import type { AccountCommand } from "@liquidation/domain/accounts/types";
import type { Journal } from "@liquidation/domain/journal/types";
import type { TrashCommand } from "@liquidation/domain/journal/trash/types";
import type { PlanCommand } from "@liquidation/domain/plans/types";
import type { PlaybookCommand } from "@liquidation/domain/playbooks/types";
import type {
  PositionCommand,
  Trade,
  TradeLinkCommand,
} from "@liquidation/domain/trades/types";
import type { WorkspaceCommand } from "@liquidation/domain/workspace/types";
import type { JOURNAL_STATUS } from "./constants.ts";

export type JournalState = Omit<Journal, "version" | "trades"> & {
  trades: Trade[] | null;
  status:
    | typeof JOURNAL_STATUS.IDLE
    | typeof JOURNAL_STATUS.LOADING
    | typeof JOURNAL_STATUS.READY
    | typeof JOURNAL_STATUS.ERROR;
  load: () => Promise<void>;
  refreshJournal: () => Promise<void>;
  updatePosition: (
    command: PositionCommand,
    uploads?: ReadonlyMap<string, File>,
  ) => Promise<void>;
  updatePlan: (
    command: PlanCommand,
    uploads?: ReadonlyMap<string, File>,
  ) => Promise<void>;
  updatePlaybook: (
    command: PlaybookCommand,
    uploads?: ReadonlyMap<string, File>,
  ) => Promise<void>;
  updateTradeLinks: (
    command: TradeLinkCommand,
    uploads?: ReadonlyMap<string, File>,
  ) => Promise<void>;
  updateTrash: (command: TrashCommand) => Promise<void>;
  updateAccount: (command: AccountCommand) => Promise<void>;
  updateWorkspace: (
    command: WorkspaceCommand,
    uploads?: ReadonlyMap<string, File>,
  ) => Promise<void>;
  updateBacktest: (
    command: BacktestCommand,
    uploads?: ReadonlyMap<string, File>,
  ) => Promise<void>;
  record: (
    trade: Omit<Trade, "id">,
    uploads?: ReadonlyMap<string, File>,
  ) => Promise<void>;
};
