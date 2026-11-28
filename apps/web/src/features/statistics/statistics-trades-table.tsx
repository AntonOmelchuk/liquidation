import {
  TRADE_FACTOR,
  TRADE_OUTCOME,
} from "@liquidation/domain/analytics/constants";
import { tradeFactorKeys } from "@liquidation/domain/analytics/trade-factors";
import { priceMetrics } from "@liquidation/domain/analytics/trade-risk";
import { tradePlaybookRules } from "@liquidation/domain/playbooks/playbook";
import { netCents } from "@liquidation/domain/trades/trade";
import { useMemo, useState } from "react";
import { SORT_DIRECTION } from "../../shared/analytics/constants.ts";
import { nextSort, sortRows } from "../../shared/analytics/sort.ts";
import { SortableHeader } from "../../shared/analytics/sortable-header.tsx";
import type { SortState } from "../../shared/analytics/types.ts";
import { EMPTY_VALUE, LOCALES } from "../../shared/constants.ts";
import { numericTone } from "../../shared/format.ts";
import { useLocale } from "../../shared/messages.ts";
import { DateText } from "../../shared/ui/date-text.tsx";
import { TradeSideBadge } from "../../shared/ui/direction-badge.tsx";
import { InstrumentLabel } from "../../shared/ui/instrument-label.tsx";
import { InfoTip } from "../../shared/ui/info-tip.tsx";
import { Panel } from "../../shared/ui/layout.tsx";
import { RecordTable, TableExcerpt } from "../../shared/ui/record-table.tsx";
import { useJournal } from "../journal/data/store.ts";
import { DEFAULT_TRADE_PAGE_SIZE } from "../journal/records/constants.ts";
import { useTradeRecordMessages } from "../journal/records/messages.ts";
import { TradeDetailsDialog } from "../journal/records/trade-details-dialog.tsx";
import {
  TradeOutcomeBadge,
  tradeResult,
} from "../journal/records/trade-outcome-badge.tsx";
import { TradePagination } from "../journal/records/trade-pagination.tsx";
import { TradeTestBadge } from "../journal/records/trade-test-badge.tsx";
import type { TradePageSize } from "../journal/records/types.ts";
import { mistakeLabel } from "../mistakes/messages.ts";
import { TRADE_LEDGER_SORT } from "./constants.ts";
import { useStatisticsMessages } from "./messages.ts";
import type {
  StatisticsTradeSort,
  StatisticsTradesTableProps,
} from "./types.ts";

export function StatisticsTradesTable({
  trades,
  labelFor,
  playbooks,
}: StatisticsTradesTableProps) {
  const { t, format, language } = useLocale();
  const s = useStatisticsMessages();
  const m = useTradeRecordMessages();
  const currency = useJournal((state) => state.currency);
  const books = useMemo(
    () => new Map(playbooks.map((book) => [book.id, book])),
    [playbooks],
  );
  const [selected, setSelected] = useState<string>();
  const [pageSize, setPageSize] = useState<TradePageSize>(
    DEFAULT_TRADE_PAGE_SIZE,
  );
  const [requestedPage, setPage] = useState(0);
  const [sort, setSort] = useState<SortState<StatisticsTradeSort>>({
    column: TRADE_LEDGER_SORT.CLOSE_DATE,
    direction: SORT_DIRECTION.DESCENDING,
  });
  const rows = useMemo(() => {
    const compare = new Intl.Collator(LOCALES[language], { numeric: true })
      .compare;
    const data = trades.map((trade) => ({
      trade,
      symbol: trade.symbol,
      opened: Date.parse(trade.openedAt),
      closed: Date.parse(trade.closedAt),
      rr: priceMetrics(trade).plannedRR,
      net: netCents(trade) / 100,
      risk: trade.riskSizing?.percent ?? null,
    }));
    return sortRows(data, (row) => row[sort.column], sort.direction, compare);
  }, [trades, sort, language]);
  const page = Math.min(
    requestedPage,
    Math.max(0, Math.ceil(rows.length / pageSize) - 1),
  );
  const start = page * pageSize;
  const record = trades.find((trade) => trade.id === selected);

  function header(column: StatisticsTradeSort, label: string) {
    return (
      <SortableHeader
        label={label}
        direction={sort.column === column ? sort.direction : undefined}
        onSort={() => {
          setSort((old) => nextSort(old, column));
          setPage(0);
        }}
      />
    );
  }

  return (
    <Panel
      title={s.tradeTable}
      detail={<InfoTip label={s.help} text={s.tradeTableHint} />}
    >
      {rows.length ? (
        <>
          <RecordTable label={s.tradeTable}>
            <thead>
              <tr>
                <th scope="col">№</th>
                {header(TRADE_LEDGER_SORT.ENTRY_DATE, s.entryDate)}
                {header(TRADE_LEDGER_SORT.CLOSE_DATE, s.closeDate)}
                <th scope="col">{t.session}</th>
                {header(TRADE_LEDGER_SORT.SYMBOL, t.symbol)}
                <th scope="col" title={t.timeframe}>
                  {m.timeframe}
                </th>
                <th scope="col">{t.side}</th>
                <th scope="col">{t.entryType}</th>
                <th scope="col">{s.modelColumn}</th>
                <th scope="col">{s.model}</th>
                <th scope="col">{m.result}</th>
                <th scope="col">{s.winColumn}</th>
                {header(TRADE_LEDGER_SORT.RISK, s.riskPct)}
                {header(TRADE_LEDGER_SORT.RR, "RR")}
                {header(TRADE_LEDGER_SORT.NET, t.pnl + " · " + currency)}
                <th scope="col">{t.mistakes}</th>
                <th scope="col">{t.notes}</th>
                <th scope="col">{s.weekday}</th>
                <th scope="col" title={m.entryTestHelp}>
                  {m.entryTest}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows
                .slice(start, start + pageSize)
                .map(({ trade, net, rr, risk }, index) => {
                  const link = trade.playbook;
                  const book = link ? books.get(link.id) : undefined;
                  const setup = link?.setupId
                    ? tradePlaybookRules(book, link)?.setupName ||
                      s.unnamedSetup
                    : undefined;
                  const [day] = tradeFactorKeys(trade, TRADE_FACTOR.WEEKDAY);
                  const mistakes = trade.mistakes
                    ?.map((tag) => mistakeLabel(tag, language))
                    .join(" · ");
                  return (
                    <tr key={trade.id}>
                      <td className="subdued">
                        {format.integer.format(start + index + 1)}
                      </td>
                      <td>
                        <DateText value={trade.openedAt} />
                      </td>
                      <td>
                        <DateText value={trade.closedAt} />
                      </td>
                      <td>
                        {trade.session
                          ? labelFor(TRADE_FACTOR.SESSION, trade.session)
                          : EMPTY_VALUE}
                      </td>
                      <th scope="row">
                        <button
                          type="button"
                          className="trade-ledger-symbol"
                          aria-label={
                            m.view +
                            " · " +
                            trade.symbol +
                            " · " +
                            format.date.format(Date.parse(trade.openedAt))
                          }
                          onClick={() => setSelected(trade.id)}
                        >
                          <InstrumentLabel symbol={trade.symbol} />
                        </button>
                      </th>
                      <td>{trade.timeframe?.toUpperCase() || EMPTY_VALUE}</td>
                      <td>
                        <TradeSideBadge side={trade.direction} />
                      </td>
                      <td>
                        {trade.entryType ? t[trade.entryType] : EMPTY_VALUE}
                      </td>
                      <td>
                        <TableExcerpt text={setup} />
                      </td>
                      <td>
                        <TableExcerpt text={book?.title} />
                      </td>
                      <td>
                        <TradeOutcomeBadge outcome={tradeResult(net)} />
                      </td>
                      <td className={net > 0 ? "positive" : "subdued"}>
                        <span
                          title={
                            net > 0
                              ? m.win
                              : s.outcomes[
                                  net < 0
                                    ? TRADE_OUTCOME.LOSS
                                    : TRADE_OUTCOME.FLAT
                                ]
                          }
                        >
                          {net > 0 ? "✓" : EMPTY_VALUE}
                        </span>
                      </td>
                      <td>
                        {risk === null
                          ? EMPTY_VALUE
                          : format.riskPercent.format(risk / 100)}
                      </td>
                      <td>
                        {rr === null ? EMPTY_VALUE : format.money.format(rr)}
                      </td>
                      <td className={numericTone(net)}>
                        <strong>{format.money.format(net)}</strong>
                      </td>
                      <td
                        className={
                          mistakes ? "record-trade-mistakes" : undefined
                        }
                      >
                        <TableExcerpt text={mistakes} />
                      </td>
                      <td>
                        <TableExcerpt text={trade.notes} />
                      </td>
                      <td>{labelFor(TRADE_FACTOR.WEEKDAY, day)}</td>
                      <td>
                        <TradeTestBadge value={trade.limitEntryTest} />
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </RecordTable>
          <TradePagination
            count={rows.length}
            page={page}
            pageSize={pageSize}
            onPage={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(0);
            }}
          />
        </>
      ) : (
        <p>{t.noTrades}</p>
      )}
      {record && (
        <TradeDetailsDialog
          key={record.id}
          record={record}
          onClose={() => setSelected(undefined)}
        />
      )}
    </Panel>
  );
}
