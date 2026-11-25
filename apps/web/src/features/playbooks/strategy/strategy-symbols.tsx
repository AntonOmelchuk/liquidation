import { instrumentSymbolSchema } from "@liquidation/domain/instruments/symbol";
import { STRATEGY_ROW_LIMIT } from "@liquidation/domain/playbooks/constants";
import { useState } from "react";
import {
  InstrumentIcons,
  InstrumentPicker,
} from "../../../shared/ui/instrument-picker.tsx";
import { useStrategyMessages } from "./messages.ts";
import type { SymbolListProps } from "./types.ts";

export function StrategySymbols({ symbols, onChange }: SymbolListProps) {
  const s = useStrategyMessages();
  const [symbol, setSymbol] = useState("");
  const parsed = instrumentSymbolSchema.safeParse(symbol);
  const canAdd =
    parsed.success &&
    !symbols.includes(parsed.data) &&
    symbols.length < STRATEGY_ROW_LIMIT;
  return (
    <>
      <div className="strategy-symbol">
        <InstrumentPicker
          label={s.instrument}
          value={symbol}
          onChange={setSymbol}
          required={false}
        />
        <button
          type="button"
          className="secondary"
          disabled={!canAdd}
          onClick={() => {
            if (!canAdd) return;
            onChange([...symbols, parsed.data]);
            setSymbol("");
          }}
        >
          {s.addInstrument}
        </button>
      </div>
      <ul className="strategy-symbols">
        {symbols.map((item) => (
          <li key={item}>
            <InstrumentIcons symbol={item} />
            {item}
            <button
              type="button"
              className="secondary"
              aria-label={s.remove + " " + item}
              onClick={() =>
                onChange(symbols.filter((value) => value !== item))
              }
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

export function StrategySymbolsView({
  symbols,
}: Pick<SymbolListProps, "symbols">) {
  const s = useStrategyMessages();
  return symbols.length ? (
    <ul className="strategy-symbols">
      {symbols.map((symbol) => (
        <li key={symbol}>
          <InstrumentIcons symbol={symbol} />
          {symbol}
        </li>
      ))}
    </ul>
  ) : (
    <p>{s.empty}</p>
  );
}
