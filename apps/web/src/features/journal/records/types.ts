import type { ScreenshotDraft } from "../../../shared/screenshots/types.ts";
import type {
  TRADE_GROUPING,
  TRADE_TABLE_MODE,
  TRADE_PAGE_SIZES,
  TRADE_EDITOR_MODE,
} from "./constants.ts";
import type { PNL_CALCULATION } from "@liquidation/domain/trades/constants";
import type { Plan } from "@liquidation/domain/plans/types";
import type {
  Playbook,
  PlaybookLink,
} from "@liquidation/domain/playbooks/types";
import type {
  Position,
  RiskSizing,
  Trade,
  TradeDirection,
  TradeLinks,
  TradePrices,
} from "@liquidation/domain/trades/types";
import type { EntryContext } from "../../playbooks/types.ts";

export type TradeRecord = Trade | Position;
export type TradeTableMode =
  (typeof TRADE_TABLE_MODE)[keyof typeof TRADE_TABLE_MODE];
export type TradeGrouping =
  (typeof TRADE_GROUPING)[keyof typeof TRADE_GROUPING];
export type TradePageSize = (typeof TRADE_PAGE_SIZES)[number];
export type TradePagination = {
  pageSize: TradePageSize;
  onPageSizeChange: (size: TradePageSize) => void;
};
export type TradeTableProps = {
  trades: readonly TradeRecord[];
  mode?: TradeTableMode;
  grouping?: TradeGrouping;
  pagination?: TradePagination;
  label?: string;
};
export type TradeDetailsDialogProps = {
  record: TradeRecord;
  onClose: () => void;
};
export type TradeRecordRowsProps = {
  records: readonly TradeRecord[];
  onInspect: (id: string) => void;
  showFinancialResult: boolean;
};

export type TradeLinksEditorProps = { trade: Trade };

export type PlanFieldProps = {
  options: readonly Plan[];
  value: string;
  onChange: (value: string) => void;
};

export type TradeEditorMode =
  (typeof TRADE_EDITOR_MODE)[keyof typeof TRADE_EDITOR_MODE];
export type TradeEditorPageProps = { mode: TradeEditorMode; id?: string };
export type TradeEditorProps = { mode: TradeEditorMode; position?: Position };
export type TradeEvidenceDraft = {
  entry: ScreenshotDraft[];
  exit: ScreenshotDraft[];
};
export type TradeEvidenceFieldsProps = {
  draft: TradeEvidenceDraft;
  onChange: (next: TradeEvidenceDraft) => void;
  closed: boolean;
  disabled: boolean;
};

export type OpenPositionsProps = { ready: boolean; account?: string };

export type TradeTagFieldsProps = { initial?: TradeLinks };
export type TradePriceFieldsProps = {
  initial?: TradeLinks;
  closed: boolean;
  forceOpen?: boolean;
  onPriceChange?: (key: keyof TradePrices, value: number | undefined) => void;
};

export type PnlMode = (typeof PNL_CALCULATION)[keyof typeof PNL_CALCULATION];
export type TradeOutcomeFieldsProps = {
  initial?: Position;
  direction: TradeDirection;
  risk: number | null;
  currency: string;
  automatic: boolean;
};
export type TradeRiskFieldsProps = {
  value: string;
  onChange: (value: string) => void;
  hasAccount: boolean;
  sizing: RiskSizing | null;
  risk: number | null;
  currency: string;
};

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
  showAccount?: boolean;
  showPrices?: boolean;
};
