import type { currencies, INSTRUMENT_MARKET } from "./constants.ts";

export type Currency = keyof typeof currencies;
export type InstrumentMarket =
  (typeof INSTRUMENT_MARKET)[keyof typeof INSTRUMENT_MARKET];
export type Instrument = {
  symbol: string;
  name: string;
  icons: readonly string[];
  market: InstrumentMarket;
};
