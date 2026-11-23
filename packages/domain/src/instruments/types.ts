import type { currencies } from "./constants.ts";

export type Currency = keyof typeof currencies;
export type Instrument = {
  symbol: string;
  name: string;
  icons: readonly string[];
};
