import type { Plan } from "@liquidation/domain/plans/types";
import type {
  Playbook,
  PlaybookLink,
} from "@liquidation/domain/playbooks/types";
import type { POSITION_ACTION } from "@liquidation/domain/trades/constants";
import type {
  Position,
  Trade,
  TradeLinks,
} from "@liquidation/domain/trades/types";
import type { RefObject } from "react";
import type { EntryContext } from "../../playbooks/types.ts";

export type TradeTableProps = { trades: readonly Trade[] };

export type TradeLinksEditorProps = { trade: Trade };

export type TradeDialogProps = {
  dialog: RefObject<HTMLDialogElement | null>;
};

export type PlanFieldProps = {
  options: readonly Plan[];
  value: string;
  onChange: (value: string) => void;
};

export type PositionFormAction =
  | { action: typeof POSITION_ACTION.OPEN }
  | {
      action: typeof POSITION_ACTION.EDIT | typeof POSITION_ACTION.CLOSE;
      position: Position;
    };

export type PositionFormProps = {
  selection: PositionFormAction;
  finish: () => void;
};

export type OpenPositionsProps = { ready: boolean };

export type TradeTagFieldsProps = { initial?: TradeLinks };

export type LinkedPlaybookRulesProps = {
  book: Playbook;
  initial?: PlaybookLink;
  historic: boolean;
  closed: boolean;
  closing: boolean;
  plannedVersion?: number;
  context: EntryContext;
};

export type TradeLinkFieldsProps = {
  openedAt: string;
  initial?: TradeLinks;
  historic?: boolean;
  closed?: boolean;
  closing?: boolean;
  risk?: number | null;
  editingId?: string;
};
