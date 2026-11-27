import { RELEASE_REACTION_MINUTES } from "@liquidation/domain/market/constants";
import { defaultReactionSymbol } from "@liquidation/domain/market/release-history";
import { useId, useRef, useState } from "react";
import { SORT_DIRECTION } from "../../../shared/analytics/constants.ts";
import { nextSort, sortRows } from "../../../shared/analytics/sort.ts";
import { SortableHeader } from "../../../shared/analytics/sortable-header.tsx";
import type { SortState } from "../../../shared/analytics/types.ts";
import { EMPTY_VALUE, LOCALES } from "../../../shared/constants.ts";
import { useLocale } from "../../../shared/messages.ts";
import { InstrumentIcons } from "../../../shared/ui/instrument-picker.tsx";
import { useMarketMessages } from "../messages.ts";
import { NEWS_COLUMN } from "./constants.ts";
import { useNewsReactionMessages } from "./messages.ts";
import { ReleaseDetail } from "./release-detail.tsx";
import type { NewsColumn, NewsTableProps } from "./types.ts";

export function NewsSeriesTable({ series }: NewsTableProps) {
  const m = useNewsReactionMessages();
  const market = useMarketMessages();
  const { format, language } = useLocale();
  const [selected, setSelected] = useState<string>();
  const trigger = useRef<HTMLButtonElement>(null);
  const detailId = useId();
  const [sort, setSort] = useState<SortState<NewsColumn>>({
    column: NEWS_COLUMN.COUNT,
    direction: SORT_DIRECTION.DESCENDING,
  });
  const details = series.find(({ key }) => key === selected);
  const locale = LOCALES[language];
  const percentage = new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 3,
  });
  const compare = new Intl.Collator(locale, {
    sensitivity: "base",
    numeric: true,
  }).compare;
  const rows = sortRows(
    series,
    (row) =>
      ({
        [NEWS_COLUMN.NAME]: row.event.name,
        [NEWS_COLUMN.COUNT]: row.observations.length,
        [NEWS_COLUMN.FIVE]: row.windows[0].medianMove,
        [NEWS_COLUMN.FIFTEEN]: row.windows[1].medianMove,
      })[sort.column],
    sort.direction,
    compare,
  );

  function header(column: NewsColumn, label: string) {
    return (
      <SortableHeader
        label={label}
        direction={sort.column === column ? sort.direction : undefined}
        onSort={() =>
          setSort((current) =>
            nextSort(
              current,
              column,
              column === NEWS_COLUMN.NAME
                ? SORT_DIRECTION.ASCENDING
                : SORT_DIRECTION.DESCENDING,
            ),
          )
        }
      />
    );
  }

  return (
    <>
      <div
        className="table news-reactions-table"
        role="region"
        aria-label={m.archive}
        tabIndex={0}
      >
        <table>
          <thead>
            <tr>
              {header(NEWS_COLUMN.NAME, market.event)}
              <th scope="col">{market.currency}</th>
              <th scope="col">{market.reactionSymbol}</th>
              {header(NEWS_COLUMN.COUNT, m.releases)}
              {header(NEWS_COLUMN.FIVE, m.median(RELEASE_REACTION_MINUTES[0]))}
              {header(
                NEWS_COLUMN.FIFTEEN,
                m.median(RELEASE_REACTION_MINUTES[1]),
              )}
              <th scope="col" title={m.movements}>
                {m.directions}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ key, event, symbol, observations, windows }) => (
              <tr key={key} data-selected={selected === key || undefined}>
                <th scope="row">
                  <button
                    className="news-series-button"
                    type="button"
                    aria-expanded={selected === key}
                    aria-controls={detailId}
                    onClick={(event) => {
                      trigger.current = event.currentTarget;
                      setSelected(selected === key ? undefined : key);
                    }}
                  >
                    {event.name}
                  </button>
                </th>
                <td>
                  <span className="instrument-label">
                    <InstrumentIcons symbol={event.currency} />
                    {event.currency}
                  </span>
                </td>
                <td>
                  <span className="instrument-label">
                    <InstrumentIcons symbol={symbol} />
                    {symbol}
                  </span>
                  {symbol !== defaultReactionSymbol(event.currency) && (
                    <small>{m.comparisonInstrument}</small>
                  )}
                </td>
                <td>{format.integer.format(observations.length)}</td>
                {windows.map(({ count, medianMove }, index) => (
                  <td key={RELEASE_REACTION_MINUTES[index]}>
                    {medianMove === null
                      ? EMPTY_VALUE
                      : percentage.format(medianMove)}
                    <small>{m.sample(format.integer.format(count))}</small>
                  </td>
                ))}
                <td className="news-directions">
                  {windows[1].count ? (
                    <span title={m.movements}>
                      <span className="positive">
                        ↑ {format.integer.format(windows[1].up)}
                      </span>
                      <span className="negative">
                        ↓ {format.integer.format(windows[1].down)}
                      </span>
                      <span>· {format.integer.format(windows[1].flat)}</span>
                    </span>
                  ) : (
                    EMPTY_VALUE
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div id={detailId}>
        {details && (
          <ReleaseDetail
            key={details.key}
            series={details}
            close={() => {
              setSelected(undefined);
              trigger.current?.focus();
            }}
          />
        )}
      </div>
    </>
  );
}
