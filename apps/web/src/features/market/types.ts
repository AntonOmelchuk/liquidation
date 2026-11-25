import type {
  CalendarEvent,
  QuoteSnapshot,
} from "@liquidation/domain/market/types";
import type { CSSProperties } from "react";

export type PollResult<Data> = {
  url: string;
  data: Data | undefined;
  failed: boolean;
  receivedAt: number;
};

export type QuoteTapeProps = {
  symbols: readonly string[];
  prices: QuoteSnapshot | undefined;
  receivedAt: number;
  unavailable: boolean;
  paused: boolean;
};

export type QuoteTrackStyle = CSSProperties & { "--quote-segment": string };

export type ReleaseReactionPanelProps = {
  event: CalendarEvent;
  id: string;
  now: number;
};
