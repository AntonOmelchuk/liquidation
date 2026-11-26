import type { Trade } from "@liquidation/domain/trades/types";
import type {
  Highlight,
  HighlightDetails,
} from "@liquidation/domain/workspace/types";
import type { PAGE } from "../../../app/constants.ts";
import type { Route } from "../../../app/types.ts";

export type BestTradesPageProps = Extract<
  Route,
  { page: typeof PAGE.BEST_TRADES }
>;

export type HighlightRecord = {
  entry: Highlight;
  trade?: Trade;
  tradeInTrash?: boolean;
  details: HighlightDetails;
};

export type HighlightEditorProps = {
  trade?: Trade;
  entry?: Highlight;
  details: HighlightDetails;
};

export type TradePickerProps = {
  trades: readonly Trade[];
  onSelect: (id: string) => void;
  onCancel: () => void;
};
