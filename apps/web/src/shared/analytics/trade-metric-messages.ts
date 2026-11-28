import { LANGUAGE } from "../constants.ts";
import { useLocale } from "../messages.ts";

const en = {
  wins: "Winning trades",
  flat: "Breakeven trades",
  losses: "Losing trades",
  winningPnl: "Total P&L of winning trades",
  losingPnl: "Total P&L of losing trades",
  averageTrade: "Average win / loss",
  averageWin: "Average win",
  averageLoss: "Average loss",
  drawdown: "Drawdown from peak",
  peakToTrough: "Peak to trough",
  expectancy: "P&L per trade",
  maxDrawdown: "Max realized drawdown",
};

const uk: typeof en = {
  wins: "Прибуткові угоди",
  flat: "Беззбиткові угоди",
  losses: "Збиткові угоди",
  winningPnl: "Сумарний P&L прибуткових угод",
  losingPnl: "Сумарний P&L збиткових угод",
  averageTrade: "Середній виграш / збиток",
  averageWin: "Середній виграш",
  averageLoss: "Середній збиток",
  drawdown: "Просадка від піка",
  peakToTrough: "Від піка до мінімуму",
  expectancy: "P&L на угоду",
  maxDrawdown: "Макс. реалізована просадка",
};

export function useTradeMetricMessages() {
  return useLocale().language === LANGUAGE.UKRAINIAN ? uk : en;
}
