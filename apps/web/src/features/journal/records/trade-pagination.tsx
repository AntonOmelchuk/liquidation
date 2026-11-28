import { useLocale } from "../../../shared/messages.ts";
import { SelectField } from "../../../shared/ui/select-field.tsx";
import { TRADE_PAGE_SIZES } from "./constants.ts";
import { useTradeRecordMessages } from "./messages.ts";
import type { TradePaginationProps } from "./types.ts";

export function TradePagination({
  count,
  page,
  pageSize,
  onPage,
  onPageSizeChange,
}: TradePaginationProps) {
  const m = useTradeRecordMessages();
  const { format } = useLocale();
  const pages = Math.max(1, Math.ceil(count / pageSize));
  const first = page * pageSize + 1;
  const last = Math.min(count, (page + 1) * pageSize);
  return (
    <nav className="trade-pagination" aria-label={m.pagination}>
      <SelectField
        label={m.tradesPerPage}
        value={pageSize}
        onChange={(event) => {
          const size = TRADE_PAGE_SIZES.find(
            (value) => value === Number(event.currentTarget.value),
          );
          if (size) onPageSizeChange(size);
        }}
      >
        {TRADE_PAGE_SIZES.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </SelectField>
      <span role="status" className="trade-page-count">
        {format.integer.format(first)}–{format.integer.format(last)} {m.of}{" "}
        {format.integer.format(count)}
      </span>
      <div className="trade-page-actions">
        <button
          type="button"
          className="secondary"
          aria-label={m.previousPage}
          disabled={page === 0}
          onClick={() => onPage(page - 1)}
        >
          ←
        </button>
        <span>
          {m.page} {page + 1} / {pages}
        </span>
        <button
          type="button"
          className="secondary"
          aria-label={m.nextPage}
          disabled={page === pages - 1}
          onClick={() => onPage(page + 1)}
        >
          →
        </button>
      </div>
    </nav>
  );
}
