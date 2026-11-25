import type { Trade } from "@liquidation/domain/trades/types";
import type { Highlight } from "@liquidation/domain/workspace/types";
import type { HIGHLIGHT_FLOW } from "./constants.ts";

export type HighlightDraft =
  | { mode: typeof HIGHLIGHT_FLOW.PICK }
  | { mode: typeof HIGHLIGHT_FLOW.EDIT; id?: string };

export type HighlightEditorProps = {
  trade?: Trade;
  entry?: Highlight;
  onClose: (saved?: boolean) => void;
};

export type TradePickerProps = {
  trades: readonly Trade[];
  onSelect: (id: string) => void;
  onCancel: () => void;
};
