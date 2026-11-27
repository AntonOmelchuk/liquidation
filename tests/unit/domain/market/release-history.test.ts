import {
  CALENDAR_SOURCE,
  CANDLE_INTERVAL,
  MARKET_IMPACT,
} from "@liquidation/domain/market/constants";
import { buildReleaseSeries } from "@liquidation/domain/market/release-history";
import type { ReleaseObservation } from "@liquidation/domain/market/types";
import { expect, it } from "vitest";

it("groups equivalent release names by currency and instrument and counts only measured windows", () => {
  function row(
    day: string,
    name: string,
    closes: [number | null, number | null],
    symbol = "EURUSD",
  ): ReleaseObservation {
    const at = day + "T13:30:00Z";
    return {
      event: {
        id: day,
        name,
        currency: "USD",
        at,
        timeKnown: true,
        impact: MARKET_IMPACT.HIGH,
        actual: "",
        forecast: "",
        previous: "",
      },
      source: CALENDAR_SOURCE.BIQUOTE,
      reaction: {
        symbol,
        at,
        interval: CANDLE_INTERVAL.MINUTE,
        before: 1,
        closes,
      },
    };
  }
  const data = [
    row("2026-09-11", "CPI m/m", [0.999, 1.002]),
    row("2026-10-09", "cpi  m/m", [1, 1]),
    row("2026-11-13", "CPI m/m", [1.004, null]),
    row("2026-11-13", "CPI m/m", [1.001, 0.998], "GBPUSD"),
    row("2026-11-13", "CPI y/y", [1.001, 0.998]),
  ];
  const [group, ...other] = buildReleaseSeries(data);
  expect(other).toHaveLength(2);
  expect(group.observations.map(({ event }) => event.id)).toEqual([
    "2026-11-13",
    "2026-10-09",
    "2026-09-11",
  ]);
  expect(group.windows[0]).toMatchObject({ count: 3, up: 1, down: 1, flat: 1 });
  expect(group.windows[1]).toMatchObject({ count: 2, up: 1, down: 0, flat: 1 });
  expect(group.windows[0].medianMove).toBeCloseTo(0.001);
  expect(group.windows[1].medianMove).toBeCloseTo(0.001);
});
