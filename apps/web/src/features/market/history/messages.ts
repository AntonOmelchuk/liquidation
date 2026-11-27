import { FORECAST_RESULT } from "@liquidation/domain/market/constants";
import { LANGUAGE } from "../../../shared/constants.ts";
import { useLocale } from "../../../shared/messages.ts";

const en = {
  nav: "News reactions",
  title: "Reactions to economic news",
  archive: "Release statistics",
  link: "News reaction statistics",
  collection:
    "Liquidation saves reactions while the local server is running. You can close this tab.",
  empty:
    "No reactions saved yet. A release needs a known time and available candle data.",
  noMatches: "No releases match these filters.",
  error: "Could not read the local news archive.",
  search: "Search releases",
  allCurrencies: "All currencies",
  allInstruments: "All instruments",
  from: "Release date from",
  through: "Release date through",
  releases: "Releases",
  series: (count: string) => count + " series",
  median: (minutes: number) => "Median move · " + minutes + " min",
  directions: "Direction · 15 min",
  movements: "Up / down / unchanged",
  sample: (count: string) => count + " measured",
  methodology:
    "Median move uses the absolute percentage change from the close before the release. Each window uses its available candles. Simultaneous releases can share the same price move.",
  releaseDate: "Release time",
  candleInterval: "Candles",
  forecastBreakdown: "Price reaction by forecast result",
  forecastResult: "Actual vs forecast",
  forecastDifference: "Actual − forecast",
  forecastGuide:
    "Each window shows the number of rising, falling and flat moves, their shares, and the signed median. Select a result to see its releases.",
  signedMedian: "Median",
  percentagePoints: "pp",
  allReleases: "Show all releases",
  legacyYuan: "Include earlier CNY / EURUSD comparisons",
  legacyOnly: "The available CNY measurements are earlier EURUSD comparisons.",
  comparisonInstrument: "Comparison",
  comparisons: {
    [FORECAST_RESULT.ABOVE]: "Above forecast",
    [FORECAST_RESULT.BELOW]: "Below forecast",
    [FORECAST_RESULT.INLINE]: "In line with forecast",
    [FORECAST_RESULT.MISSING]: "Missing comparable values",
  },
};

const uk: typeof en = {
  nav: "Реакції на новини",
  title: "Реакція ціни на економічні новини",
  archive: "Статистика за новинами",
  link: "Статистика реакцій",
  collection:
    "Liquidation зберігає реакції, поки працює локальний сервер. Вкладку можна закрити.",
  empty:
    "Реакцій ще немає. Для вимірювання потрібні точний час релізу та доступні свічки.",
  noMatches: "За цими фільтрами релізів немає.",
  error: "Не вдалося прочитати локальну історію новин.",
  search: "Пошук новини",
  allCurrencies: "Усі валюти",
  allInstruments: "Усі інструменти",
  from: "Дата релізу від",
  through: "Дата релізу до",
  releases: "Релізів",
  series: (count) => "Груп новин · " + count,
  median: (minutes) => "Медіанний рух · " + minutes + " хв",
  directions: "Напрямок · 15 хв",
  movements: "Зростання / падіння / без змін",
  sample: (count) => "Вимірів · " + count,
  methodology:
    "Медіанний рух рахуємо за абсолютною зміною у відсотках від ціни перед релізом. Кожне вікно має власну вибірку доступних свічок. Одночасні релізи можуть мати однаковий рух ціни.",
  releaseDate: "Час релізу",
  candleInterval: "Свічки",
  forecastBreakdown: "Реакція ціни залежно від факту",
  forecastResult: "Факт відносно прогнозу",
  forecastDifference: "Факт − прогноз",
  forecastGuide:
    "Для кожного інтервалу показано кількість і частку зростань, падінь і рухів без змін, а також медіану зі знаком. Натисни на результат, щоб переглянути його релізи.",
  signedMedian: "Медіана",
  percentagePoints: "п.п.",
  allReleases: "Показати всі релізи",
  legacyYuan: "Показати попередні порівняння CNY / EURUSD",
  legacyOnly: "Наразі для CNY доступні попередні порівняння з EURUSD.",
  comparisonInstrument: "Порівняння",
  comparisons: {
    [FORECAST_RESULT.ABOVE]: "Вище прогнозу",
    [FORECAST_RESULT.BELOW]: "Нижче прогнозу",
    [FORECAST_RESULT.INLINE]: "На рівні прогнозу",
    [FORECAST_RESULT.MISSING]: "Немає порівнюваних даних",
  },
};

export function useNewsReactionMessages() {
  return useLocale().language === LANGUAGE.UKRAINIAN ? uk : en;
}
