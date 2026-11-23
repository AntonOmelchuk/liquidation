import type {
  Backtest,
  BacktestSample,
} from "@liquidation/domain/backtests/types";
import type { Trade } from "@liquidation/domain/trades/types";

export type BacktestMetricsProps = { samples: readonly BacktestSample[] };

export type BacktestComparisonProps = {
  run: Backtest;
  trades: readonly Trade[];
};

export type BacktestSampleFormProps = {
  run: Backtest;
  sample?: BacktestSample;
  finish: () => void;
};

export type BacktestEditorProps = { run?: Backtest };
