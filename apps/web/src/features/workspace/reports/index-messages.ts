import { LANGUAGE } from "../../../shared/constants.ts";
import { useLocale } from "../../../shared/messages.ts";

const en = {
  quarterCalendar: "Quarter calendar",
  previousQuarter: "Previous quarter",
  nextQuarter: "Next quarter",
  currentQuarter: "This quarter",
  addDaily: "＋ DRC",
  addWeekly: "＋ WRC",
  dailyCardCount: "Daily cards",
  weeklyCardCount: "Weekly cards",
  tradingWithoutCard: "Traded · no card",
  addCard: "Add card",
  weeklyCard: "Weekly card",
  written: "Written",
  build: "Start review",
  noConclusion: "In progress",
  conclusions: "Conclusions saved",
  coverage: "Reviewed trading days",
  returnToShelf: "Report history",
  openCards: "Open card calendar",
  reportHistory: "Monthly and quarterly reviews",
  noReport: "Review pending",
  bestTrade: "Best realized trade",
  worstTrade: "Worst realized trade",
  financialSummary: "Performance by account",
  missingReviews: "Trading days without DRC",
  coverageHint:
    "Coverage counts the local dates on which a trade was opened. Performance for reports uses closing dates.",
  weekBasis:
    "Weekly cards count trades by entry date. Daily cards use the closing date.",
};
const uk: typeof en = {
  quarterCalendar: "Календар кварталу",
  previousQuarter: "Попередній квартал",
  nextQuarter: "Наступний квартал",
  currentQuarter: "Поточний квартал",
  addDaily: "＋ DRC",
  addWeekly: "＋ WRC",
  dailyCardCount: "Денних карток",
  weeklyCardCount: "Тижневих карток",
  tradingWithoutCard: "Торгував · без картки",
  addCard: "Додати картку",
  weeklyCard: "Тижнева картка",
  written: "Заповнено",
  build: "Почати рев’ю",
  noConclusion: "У роботі",
  conclusions: "Збережено висновки",
  coverage: "Дні торгівлі з DRC",
  returnToShelf: "Історія звітів",
  openCards: "Календар карток",
  reportHistory: "Місячні й квартальні рев’ю",
  noReport: "Очікує рев’ю",
  bestTrade: "Найкраща закрита угода",
  worstTrade: "Найгірша закрита угода",
  financialSummary: "Результат за рахунками",
  missingReviews: "Торгові дні без DRC",
  coverageHint:
    "Заповнення DRC оцінюється за днями входу. Фінансові звіти використовують дати закриття.",
  weekBasis:
    "Тижневі картки рахують угоди за датою входу. Денні — за датою закриття.",
};
export function useReportIndexMessages() {
  return useLocale().language === LANGUAGE.UKRAINIAN ? uk : en;
}
