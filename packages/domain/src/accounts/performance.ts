import { tradeStatistics } from "../analytics/trade-statistics.ts";
import { fromCents, toCents } from "../shared/money.ts";
import { netCents } from "../trades/trade.ts";
import { shiftDay } from "../workspace/period.ts";
import { LIMIT_UNIT, MAX_LOSS_MODE, MOVEMENT_KIND } from "./constants.ts";
import type {
  Account,
  AccountLedgerPoint,
  AccountLimit,
  AccountSource,
} from "./types.ts";

function firmDayReader(timeZone: string, dayStart: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  return (iso: string) => {
    const parts = new Map(
      formatter
        .formatToParts(Date.parse(iso))
        .map(({ type, value }) => [type, value]),
    );
    const day = [parts.get("year"), parts.get("month"), parts.get("day")].join(
      "-",
    );
    const time = [parts.get("hour"), parts.get("minute")].join(":");
    return time < dayStart ? shiftDay(day, -1) : day;
  };
}

export function firmDay(iso: string, timeZone: string, dayStart: string) {
  return firmDayReader(timeZone, dayStart)(iso);
}

export function accountPerformance(
  account: Account,
  source: AccountSource,
  now = new Date().toISOString(),
) {
  const end = Date.parse(now);
  const trades = source.trades.filter(
    ({ accountId, closedAt }) =>
      accountId === account.id && Date.parse(closedAt) <= end,
  );
  const positions = source.positions.filter(
    ({ accountId, openedAt }) =>
      accountId === account.id && Date.parse(openedAt) <= end,
  );
  const movements = source.movements.filter(
    ({ accountId, at }) => accountId === account.id && Date.parse(at) <= end,
  );
  const moneyByKind = Object.fromEntries(
    Object.values(MOVEMENT_KIND).map((kind) => [kind, 0]),
  ) as Record<AccountSource["movements"][number]["kind"], number>;
  for (const movement of movements)
    moneyByKind[movement.kind] += toCents(movement.amount);
  const opening = toCents(account.startingBalance);
  const firstEntry = [...trades, ...positions].reduce(
    (first, { openedAt }) => Math.min(first, Date.parse(openedAt)),
    end,
  );
  const funded =
    opening +
    movements
      .filter(
        ({ kind, at }) =>
          kind === MOVEMENT_KIND.DEPOSIT && Date.parse(at) <= firstEntry,
      )
      .reduce((total, { amount }) => total + toCents(amount), 0);
  const events = [
    ...trades.map((trade) => ({
      timestamp: Date.parse(trade.closedAt),
      cash: netCents(trade),
      performance: netCents(trade),
    })),
    ...movements.map((movement) => ({
      timestamp: Date.parse(movement.at),
      cash: toCents(movement.amount),
      performance:
        movement.kind === MOVEMENT_KIND.FEE ? toCents(movement.amount) : 0,
    })),
  ].sort((a, b) => a.timestamp - b.timestamp);
  let balance = opening;
  let performance = 0;
  let performancePeak = 0;
  let maxDrawdown = 0;
  let maxDrawdownRate: number | null = funded > 0 ? 0 : null;
  const points: AccountLedgerPoint[] = [];
  for (const [index, event] of events.entries()) {
    balance += event.cash;
    performance += event.performance;
    if (events[index + 1]?.timestamp === event.timestamp) continue;
    performancePeak = Math.max(performancePeak, performance);
    const drawdown = performancePeak - performance;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
    if (funded > 0 && funded + performancePeak > 0)
      maxDrawdownRate = Math.max(
        maxDrawdownRate ?? 0,
        drawdown / (funded + performancePeak),
      );
    points.push({
      timestamp: event.timestamp,
      balance: fromCents(balance),
      performance: fromCents(performance),
    });
  }
  const openRisk = positions.reduce(
    (total, position) =>
      total + (position.breakeven ? 0 : toCents(position.risk ?? 0)),
    0,
  );
  const riskUnknown = positions.filter(
    ({ risk, breakeven }) => !breakeven && risk === null,
  ).length;
  return {
    balance: fromCents(balance),
    funded: fromCents(funded),
    performance: fromCents(performance),
    performancePeak: fromCents(performancePeak),
    returnRate: funded > 0 ? performance / funded : null,
    maxDrawdown: fromCents(maxDrawdown),
    maxDrawdownRate,
    deposits: fromCents(moneyByKind.deposit),
    withdrawals: fromCents(-moneyByKind.withdrawal),
    fees: fromCents(moneyByKind.fee),
    corrections: fromCents(moneyByKind.correction),
    openRisk: fromCents(openRisk),
    riskUnknown,
    positions: positions.length,
    breakevenPositions: positions.filter(({ breakeven }) => breakeven).length,
    stats: tradeStatistics(trades),
    points,
  };
}

function limitAmount(limit: AccountLimit | undefined, funded: number) {
  if (!limit) return null;
  if (limit.unit === LIMIT_UNIT.MONEY) return limit.value;
  return funded > 0 ? fromCents(toCents((funded * limit.value) / 100)) : null;
}

export function accountRuleProgress(
  account: Account,
  source: AccountSource,
  now = new Date().toISOString(),
  result = accountPerformance(account, source, now),
) {
  const rules = account.rules;
  if (!rules) return null;
  const end = Date.parse(now);
  const day = firmDayReader(rules.timeZone, rules.dayStart);
  const current = day(now);
  const trades = source.trades.filter(
    ({ accountId, closedAt }) =>
      accountId === account.id && Date.parse(closedAt) <= end,
  );
  const positions = source.positions.filter(
    ({ accountId, openedAt }) =>
      accountId === account.id && Date.parse(openedAt) <= end,
  );
  const closedToday =
    trades
      .filter(({ closedAt }) => day(closedAt) === current)
      .reduce((sum, trade) => sum + netCents(trade), 0) +
    source.movements
      .filter(
        ({ accountId, kind, at }) =>
          accountId === account.id &&
          kind === MOVEMENT_KIND.FEE &&
          Date.parse(at) <= end &&
          day(at) === current,
      )
      .reduce((sum, { amount }) => sum + toCents(amount), 0);
  const dailyLimit = limitAmount(rules.dailyLimit, result.funded);
  const dailyUsed = fromCents(
    Math.max(
      0,
      (rules.countOpenRisk ? toCents(result.openRisk) : 0) -
        (rules.countClosed ? closedToday : 0),
    ),
  );
  const dailyRemaining =
    dailyLimit === null
      ? null
      : fromCents(toCents(dailyLimit) - toCents(dailyUsed));
  const lossLimit = limitAmount(rules.maxLoss, result.funded);
  const trailingPeak =
    rules.maxLossMode === MAX_LOSS_MODE.STATIC ? 0 : result.performancePeak;
  const floorGrowth =
    lossLimit === null
      ? null
      : rules.maxLossMode === MAX_LOSS_MODE.TRAILING_TO_START
        ? Math.min(0, trailingPeak - lossLimit)
        : trailingPeak - lossLimit;
  const floor =
    floorGrowth === null
      ? null
      : fromCents(toCents(result.funded) + toCents(floorGrowth));
  const performanceBalance = fromCents(
    toCents(result.funded) + toCents(result.performance),
  );
  const remaining =
    floor === null
      ? null
      : fromCents(toCents(performanceBalance) - toCents(floor));
  const remainingAtStops =
    remaining === null
      ? null
      : fromCents(toCents(remaining) - toCents(result.openRisk));
  const target = limitAmount(rules.target, result.funded);
  const tradingDays = new Set(
    [...trades, ...positions].map(({ openedAt }) => day(openedAt)),
  ).size;
  return {
    firmDay: current,
    closedToday: fromCents(closedToday),
    dailyLimit,
    dailyUsed,
    dailyRemaining,
    riskUnknown: result.riskUnknown,
    dailyIncomplete: Boolean(
      rules.dailyLimit &&
      (dailyLimit === null || (rules.countOpenRisk && result.riskUnknown > 0)),
    ),
    maxLossIncomplete: Boolean(
      rules.maxLoss && (lossLimit === null || result.riskUnknown > 0),
    ),
    floor,
    performanceBalance,
    remaining,
    remainingAtStops,
    target,
    targetRemaining:
      target === null
        ? null
        : fromCents(Math.max(0, toCents(target) - toCents(result.performance))),
    tradingDays,
    minimumDays: rules.minimumDays,
  };
}
