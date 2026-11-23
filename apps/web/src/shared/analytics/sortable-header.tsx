import { SORT_DIRECTION } from "./constants.ts";
import type { SortableHeaderProps } from "./types.ts";

export function SortableHeader({
  label,
  direction,
  onSort,
  title,
}: SortableHeaderProps) {
  return (
    <th scope="col" aria-sort={direction} title={title}>
      <button className="analytics-sort" type="button" onClick={onSort}>
        {label}
        <span aria-hidden="true">
          {direction
            ? direction === SORT_DIRECTION.ASCENDING
              ? "↑"
              : "↓"
            : "↕"}
        </span>
      </button>
    </th>
  );
}
