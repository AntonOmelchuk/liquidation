import { LANGUAGE } from "../../../shared/constants.ts";
import { useLocale } from "../../../shared/messages.ts";

const en = {
  profitDay: "Profit",
  lossDay: "Loss",
  flatDay: "Zero P&L",
};

const uk: typeof en = {
  profitDay: "Прибуток",
  lossDay: "Збиток",
  flatDay: "Нульовий P&L",
};

export function useDashboardMessages() {
  return useLocale().language === LANGUAGE.UKRAINIAN ? uk : en;
}
