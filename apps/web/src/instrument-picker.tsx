import { useId, useState } from "react";
import type { KeyboardEvent } from "react";
import {
  instrumentIcons,
  searchInstruments,
} from "../../../packages/domain/instruments.ts";

export function InstrumentIcons({ symbol }: { symbol: string }) {
  return (
    <span className="instrument-icons" aria-hidden="true">
      {instrumentIcons(symbol).map((icon, index) => (
        <span key={index}>{icon}</span>
      ))}
    </span>
  );
}

export function InstrumentPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const matches = searchInstruments(value);
  const visible = open && matches.length > 0;
  const activeOption = visible ? matches[active] : undefined;

  function close() {
    setOpen(false);
    setActive(-1);
  }

  function select(symbol: string) {
    onChange(symbol);
    close();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Escape" && open) {
      event.preventDefault();
      close();
    } else if (event.key === "Enter" && activeOption) {
      event.preventDefault();
      select(activeOption.symbol);
    } else if (
      (event.key === "ArrowDown" || event.key === "ArrowUp") &&
      matches.length
    ) {
      event.preventDefault();
      const next =
        event.key === "ArrowDown"
          ? (active + 1) % matches.length
          : active <= 0
            ? matches.length - 1
            : active - 1;
      setOpen(true);
      setActive(next);
      requestAnimationFrame(() =>
        document
          .getElementById(`${id}-${matches[next].symbol}`)
          ?.scrollIntoView({ block: "nearest" }),
      );
    }
  }

  return (
    <div className="instrument-picker">
      <label htmlFor={id}>Symbol</label>
      <input
        id={id}
        name="symbol"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={visible}
        aria-controls={visible ? `${id}-options` : undefined}
        aria-activedescendant={
          activeOption ? `${id}-${activeOption.symbol}` : undefined
        }
        autoComplete="off"
        placeholder="EURUSD"
        required
        maxLength={24}
        value={value}
        onFocus={() => setOpen(true)}
        onBlur={close}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onKeyDown={onKeyDown}
      />
      {visible && (
        <ul id={`${id}-options`} role="listbox" aria-label="Instruments">
          {matches.map(({ symbol, name }, index) => (
            <li
              key={symbol}
              id={`${id}-${symbol}`}
              role="option"
              aria-selected={index === active}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => select(symbol)}
            >
              <InstrumentIcons symbol={symbol} />
              <span>
                <strong>{symbol}</strong>
                <small>{name}</small>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
