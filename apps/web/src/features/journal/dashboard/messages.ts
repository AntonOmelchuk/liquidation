import { LANGUAGE } from "../../../shared/constants.ts";
import { useLocale } from "../../../shared/messages.ts";

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
  profitDay: "Profit",
  lossDay: "Loss",
  flatDay: "Zero P&L",
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
  profitDay: "Прибуток",
  lossDay: "Збиток",
  flatDay: "Нульовий P&L",
};

export function useDashboardMessages() {
  return useLocale().language === LANGUAGE.UKRAINIAN ? uk : en;
}
