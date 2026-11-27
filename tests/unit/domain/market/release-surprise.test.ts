import {
  CALENDAR_SOURCE,
  CANDLE_INTERVAL,
  FORECAST_RESULT,
  MARKET_IMPACT,
} from "@liquidation/domain/market/constants";
import {
  compareForecast,
  compareReleaseObservations,
  summarizeForecastReactions,
} from "@liquidation/domain/market/release-surprise";
import type { ReleaseObservation } from "@liquidation/domain/market/types";
import { expect, it } from "vitest";

it.each([
  ["0.3%", "0.2%", FORECAST_RESULT.ABOVE, 0.1, "%"],
  ["−0.4%", "-0.2%", FORECAST_RESULT.BELOW, -0.2, "%"],
  ["-0.2%", "-0.4%", FORECAST_RESULT.ABOVE, 0.2, "%"],
  ["0.0%", "0%", FORECAST_RESULT.INLINE, 0, "%"],
  ["1.002M", "1,001K", FORECAST_RESULT.ABOVE, 1_000, ""],
  ["1.001K", "1001", FORECAST_RESULT.INLINE, 0, ""],
  ["1 450K", "1,200K", FORECAST_RESULT.ABOVE, 250, "K"],
] as const)(
  "compares actual %s with forecast %s",
  (actual, forecast, result, difference, unit) => {
    const comparison = compareForecast({ actual, forecast });
    expect(comparison).toMatchObject({ result, unit });
    expect(comparison).toHaveProperty("difference", expect.closeTo(difference));
  },
);

it.each([
  ["", "0"],
  ["0", ""],
  ["0.2%", "0.1"],
  ["4-3-2", "3-4-2"],
  ["—", "0.1%"],
] as const)(
  "keeps unavailable or incompatible readings %s and %s out of comparable groups",
  (actual, forecast) => {
    expect(compareForecast({ actual, forecast })).toEqual({
      result: FORECAST_RESULT.MISSING,
    });
  },
);

it("summarizes the signed price reactions by forecast result using each window's own sample", () => {
  function observation(
    id: number,
    actual: string,
    closes: [number | null, number | null],
  ): ReleaseObservation {
    const at = "2026-11-27T13:30:00Z";
    return {
      event: {
        id: String(id),
        name: "CPI m/m",
        currency: "USD",
        at,
        timeKnown: true,
        impact: MARKET_IMPACT.HIGH,
        actual,
        forecast: "0.2%",
        previous: "0.5%",
      },
      source: CALENDAR_SOURCE.BIQUOTE,
      reaction: {
        symbol: "EURUSD",
        at,
        interval: CANDLE_INTERVAL.MINUTE,
        before: 1,
        closes,
      },
    };
  }
  const [above, below, inline, missing] = summarizeForecastReactions(
    compareReleaseObservations([
      observation(1, "0.3%", [1.001, 0.998]),
      observation(2, "0.4%", [1.003, null]),
      observation(3, "0.1%", [0.999, 1.001]),
      observation(4, "0.2%", [1, 1]),
      observation(5, "", [1.001, 1.002]),
    ]),
  );

  expect(above).toMatchObject({
    result: FORECAST_RESULT.ABOVE,
    count: 2,
    windows: [
      { count: 2, up: 2 },
      { count: 1, down: 1 },
    ],
  });
  expect(above.windows[0].signedMedianMove).toBeCloseTo(0.002);
  expect(above.windows[1].signedMedianMove).toBeCloseTo(-0.002);
  expect(below.windows[1].up).toBe(1);
  expect(inline.windows[0].flat).toBe(1);
  expect(missing.result).toBe(FORECAST_RESULT.MISSING);
});
