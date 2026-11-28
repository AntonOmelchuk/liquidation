import { ICON_ACTION } from "../../../shared/ui/constants.ts";
import { IconAction } from "../../../shared/ui/icon-action.tsx";
import {
  STRATEGY_ROW_LIMIT,
  STRATEGY_SHORT_LIMIT,
  STRATEGY_TEXT_LIMIT,
} from "@liquidation/domain/playbooks/constants";
import type { StrategyRow } from "@liquidation/domain/playbooks/types";
import { useStrategyMessages } from "./messages.ts";
import type { StrategyRowsProps } from "./types.ts";

export function strategyRow(): StrategyRow {
  return { id: crypto.randomUUID(), label: "", detail: "" };
}

export function StrategyRows<T extends StrategyRow>({
  title,
  rows,
  onChange,
  create,
  label,
  detail,
  ordered,
  render,
}: StrategyRowsProps<T>) {
  const s = useStrategyMessages();

  function move(from: number, to: number) {
    const next = [...rows];
    const [row] = next.splice(from, 1);
    next.splice(to, 0, row);
    onChange(next);
  }

  return (
    <section className="strategy-row-group">
      {title && <h3>{title}</h3>}
      {rows.map((row, index) => {
        const update = (patch: Partial<T>) =>
          onChange(
            rows.map((item) =>
              item.id === row.id ? { ...item, ...patch } : item,
            ),
          );
        return (
          <div className="strategy-row" key={row.id}>
            <div className="strategy-row-inputs">
              <label>
                {label}
                <input
                  required
                  maxLength={STRATEGY_SHORT_LIMIT}
                  value={row.label}
                  onChange={(event) =>
                    update({ label: event.target.value } as Partial<T>)
                  }
                />
              </label>
              <label>
                {detail ?? s.detail}
                <textarea
                  rows={2}
                  maxLength={STRATEGY_TEXT_LIMIT}
                  value={row.detail}
                  onChange={(event) =>
                    update({ detail: event.target.value } as Partial<T>)
                  }
                />
              </label>
              {render?.(row, update)}
            </div>
            <div className="strategy-row-actions">
              {ordered && (
                <>
                  <button
                    className="secondary"
                    type="button"
                    disabled={index === 0}
                    aria-label={s.earlier}
                    onClick={() => move(index, index - 1)}
                  >
                    ↑
                  </button>
                  <button
                    className="secondary"
                    type="button"
                    disabled={index === rows.length - 1}
                    aria-label={s.later}
                    onClick={() => move(index, index + 1)}
                  >
                    ↓
                  </button>
                </>
              )}
              <IconAction
                icon={ICON_ACTION.DELETE}
                label={s.remove}
                onClick={() =>
                  onChange(rows.filter((item) => item.id !== row.id))
                }
              />
            </div>
          </div>
        );
      })}
      <button
        className="secondary"
        type="button"
        disabled={rows.length >= STRATEGY_ROW_LIMIT}
        onClick={() => onChange([...rows, create()])}
      >
        {s.add}
      </button>
    </section>
  );
}
