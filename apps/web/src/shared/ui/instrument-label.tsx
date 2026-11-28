import { InstrumentIcons } from "./instrument-picker.tsx";

export function InstrumentLabel({ symbol }: { symbol: string }) {
  return (
    <span className="instrument-label">
      <InstrumentIcons symbol={symbol} />
      {symbol}
    </span>
  );
}
