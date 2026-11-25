import {
  instrumentIcons,
  searchInstruments,
} from "@liquidation/domain/instruments/instruments";
import type { KeyboardEvent } from "react";
import { useId, useState } from "react";
import { useLocale } from "../messages.ts";
import { FLAG_EMOJI, KEYBOARD_KEY } from "./constants.ts";
import type { InstrumentIconsProps, InstrumentPickerProps } from "./types.ts";

export function InstrumentIcons({ symbol }: InstrumentIconsProps) {
  return (
    <span className="instrument-icons" aria-hidden="true">
      {instrumentIcons(symbol).map((icon, index) => (
        <span
          key={index}
          className={FLAG_EMOJI.test(icon) ? "instrument-flag" : undefined}
        >
          {icon}
        </span>
      ))}
    </span>
  );
}

export function InstrumentPicker({
  value,
  onChange,
  required = true,
  label,
}: InstrumentPickerProps) {
  const { t } = useLocale();
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
    if (event.key === KEYBOARD_KEY.ESCAPE && open) {
      event.preventDefault();
      close();
    } else if (event.key === KEYBOARD_KEY.ENTER && activeOption) {
      event.preventDefault();
      select(activeOption.symbol);
    } else if (
      (event.key === KEYBOARD_KEY.DOWN || event.key === KEYBOARD_KEY.UP) &&
      matches.length
    ) {
      event.preventDefault();
      const next =
        event.key === KEYBOARD_KEY.DOWN
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
      <label htmlFor={id}>{label ?? t.symbol}</label>
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
        required={required}
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
        <ul id={`${id}-options`} role="listbox" aria-label={t.instruments}>
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
