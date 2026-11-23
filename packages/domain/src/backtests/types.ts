import type { z } from "zod";
import type {
  backtestCommand,
  backtestSampleFieldsSchema,
  backtestSchema,
} from "./backtest.ts";

export type Backtest = z.infer<typeof backtestSchema>;

export type BacktestCommand = z.infer<typeof backtestCommand>;

export type BacktestSample = Backtest["samples"][number];

export type BacktestPrices = Pick<
  z.infer<typeof backtestSampleFieldsSchema>,
  "direction" | "entry" | "stop" | "exit" | "costsR"
>;
