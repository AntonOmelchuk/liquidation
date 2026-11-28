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
  finish: (savedId?: string) => void;
};

export type BacktestEditorProps = { run?: Backtest };

export type BacktestSamplePageProps = {
  id: string;
  sampleId?: string;
  editing: boolean;
};
