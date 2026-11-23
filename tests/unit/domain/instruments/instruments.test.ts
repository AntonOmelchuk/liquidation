import {
  instrumentIcons,
  searchInstruments,
} from "@liquidation/domain/instruments/instruments";
import { expect, test } from "vitest";

test("finds symbols and instrument names regardless of case or pair separators", () => {
  expect(searchInstruments(" eur/usd ")[0]?.symbol).toBe("EURUSD");
  expect(searchInstruments("Nasdaq").map(({ symbol }) => symbol)).toEqual([
    "NAS100",
    "NQ",
  ]);
  expect(searchInstruments("custom-ticker")).toEqual([]);
});

test("resolves catalog icons for ticker suffixes and falls back for custom symbols", () => {
  expect(instrumentIcons("eurusd.a")).toEqual(["🇪🇺", "🇺🇸"]);
  expect(instrumentIcons("NAS100.cash")).toEqual(["🇺🇸"]);
  expect(instrumentIcons("CUSTOM")).toEqual(["CU"]);
});
