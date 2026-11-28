import { useTradeRecordMessages } from "./messages.ts";

export function TradeTestBadge({ value }: { value?: boolean }) {
  const m = useTradeRecordMessages();
  const text =
    value === undefined
      ? m.entryTestUnknown
      : value
        ? m.entryTestYes
        : m.entryTestNo;
  const tone = value === undefined ? "subdued" : value ? "positive" : "neutral";
  return (
    <span className={"record-tag " + tone} title={m.entryTestHelp}>
      {text}
    </span>
  );
}
