import { netCents, realizedR } from "../trades/trade.ts";
import type { Trade } from "../trades/types.ts";
import { priceMoveR } from "../trades/prices.ts";
import { R_BUCKET, STOP_OVERRUN_R } from "./constants.ts";
import type { PriceMetrics, RiskDrawdown, TradeCurvePoint } from "./types.ts";

export function tradeCurves(trades: readonly Trade[]) {
  const groups = Map.groupBy(trades, (trade) => Date.parse(trade.closedAt));
  let net = 0;
  let totalR = 0;
  const cash: TradeCurvePoint[] = [];
  const multiples: TradeCurvePoint[] = [];
  for (const [timestamp, records] of [...groups].sort(([a], [b]) => a - b)) {
    let measured = false;
    for (const trade of records) {
      net += netCents(trade);
      const r = realizedR(trade);
      if (r !== null) {
        totalR += r;
        measured = true;
      }
    }
    cash.push({ timestamp, value: net / 100 });
    if (measured) multiples.push({ timestamp, value: totalR });
  }
  return { cash, multiples };
}

export function riskDrawdown(points: readonly TradeCurvePoint[]): RiskDrawdown {
  let peak = 0;
  let peakAt: number | null = null;
  let worst: RiskDrawdown = {
    amount: 0,
    peakValue: 0,
    peakAt: null,
    troughAt: null,
    recoveredAt: null,
  };
  for (const { timestamp, value } of points) {
    if (
      worst.troughAt !== null &&
      worst.recoveredAt === null &&
      timestamp > worst.troughAt &&
      value >= worst.peakValue
    )
      worst = { ...worst, recoveredAt: timestamp };
    const amount = peak - value;
    if (amount > worst.amount)
      worst = {
        amount,
        peakValue: peak,
        peakAt,
        troughAt: timestamp,
        recoveredAt: null,
      };
    if (value >= peak) {
      peak = value;
      peakAt = timestamp;
    }
  }
  return worst;
}

function riskBucket(value: number) {
  if (value <= -2) return R_BUCKET.BELOW_MINUS_TWO;
  if (value <= -1) return R_BUCKET.MINUS_TWO_TO_MINUS_ONE;
  if (value < 0) return R_BUCKET.MINUS_ONE_TO_ZERO;
  if (value === 0) return R_BUCKET.ZERO;
  if (value <= 1) return R_BUCKET.ZERO_TO_ONE;
  if (value <= 2) return R_BUCKET.ONE_TO_TWO;
  return R_BUCKET.ABOVE_TWO;
}

export function riskDistribution(trades: readonly Trade[]) {
  const measured = trades.flatMap((trade) => {
    const r = realizedR(trade);
    return r === null ? [] : [{ trade, r }];
  });
  const groups = Map.groupBy(measured, ({ r }) => riskBucket(r));
  return Object.values(R_BUCKET).map((key) => {
    const records = groups.get(key) ?? [];
    return {
      key,
      records: records.map(({ trade }) => trade),
      count: records.length,
      totalR: records.reduce((sum, { r }) => sum + r, 0),
    };
  });
}

export function stopOverruns(
  trades: readonly Trade[],
  threshold = STOP_OVERRUN_R,
) {
  return trades
    .flatMap((trade) => {
      const r = realizedR(trade);
      return r !== null && r <= -threshold
        ? [{ trade, r, excessR: -r - 1 }]
        : [];
    })
    .sort((a, b) => a.r - b.r);
}

export function priceMetrics(trade: Trade): PriceMetrics {
  const prices = trade.prices;
  const unavailable = {
    plannedRR: null,
    grossR: null,
    mfe: null,
    mae: null,
    givebackR: null,
  };
  if (
    prices?.entry === undefined ||
    prices.stop === undefined ||
    prices.stop === prices.entry
  )
    return unavailable;
  const toR = (price?: number) => priceMoveR(trade.direction, prices, price);
  const grossR = toR(prices.exit);
  const mfe = toR(prices.favorable);
  const adverse = toR(prices.adverse);
  return {
    plannedRR: toR(prices.target),
    grossR,
    mfe,
    mae: adverse === null ? null : -adverse,
    givebackR:
      mfe === null || grossR === null ? null : Math.max(0, mfe - grossR),
  };
}

export function summarizePrices(trades: readonly Trade[]) {
  const rows = trades.map(priceMetrics);
  const measures = ["plannedRR", "grossR", "mfe", "mae", "givebackR"] as const;
  return Object.fromEntries(
    measures.map((key) => {
      const values = rows.flatMap((row) =>
        row[key] === null ? [] : [row[key]],
      );
      return [
        key,
        {
          count: values.length,
          average: values.length
            ? values.reduce((sum, value) => sum + value, 0) / values.length
            : null,
        },
      ];
    }),
  ) as Record<
    (typeof measures)[number],
    { count: number; average: number | null }
  >;
}
