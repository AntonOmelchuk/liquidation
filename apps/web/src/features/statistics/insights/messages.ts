import { LANGUAGE } from "../../../shared/constants.ts";
import { useLocale } from "../../../shared/messages.ts";

const en = {
  title: "Trading insights",
  subtitle:
    "A local statistical report of observed performance. Each factor is compared using net expectancy per trade, with average R included when risk is recorded.",
  strongest: "Strongest observed group",
  weakest: "Weakest observed group",
  lackSample: "No comparable group has enough observations.",
  positive: "Profitable groups — candidates to test",
  negative: "Losing groups — candidates to review",
  factor: "Factor",
  all: "All factors",
  sample: "Sample",
  sufficient: "20+ trades",
  small: "Small sample",
  onlySufficient: "Show groups with 20+ trades",
  minHint:
    "Groups with fewer than 20 trades are preliminary. The ranking uses historical cash expectancy, which can be influenced by position size and overlapping factors.",
  include: "Test keeping",
  exclude: "Test exclusion",
  includeSelected: "Test keeping any selected group",
  excludeSelected: "Test excluding any selected group",
  scenario: "Historical what-if comparison",
  actual: "Actual",
  simulated: "With rule",
  kept: "Trades retained",
  removed: "Trades excluded",
  ruleKeep: "Keep trades matching any chosen group",
  ruleRemove: "Exclude trades matching any chosen group",
  limitation:
    "This is an in-sample historical comparison. Treat the apparent improvement as a hypothesis to validate in future trades or an independent backtest.",
  noGroups: "No matching groups in this selection.",
  ai: "Open AI Review",
};

const uk: typeof en = {
  title: "Висновки з торгової статистики",
  subtitle:
    "Локальний статистичний звіт про історичні результати. Порівняння факторів використовує чисте очікування на угоду, а за наявності ризику — також середній R.",
  strongest: "Найсильніша група",
  weakest: "Найслабша група",
  lackSample: "Бракує спостережень для зіставлення груп.",
  positive: "Прибуткові групи — кандидати для перевірки",
  negative: "Збиткові групи — кандидати для перегляду",
  factor: "Фактор",
  all: "Усі фактори",
  sample: "Вибірка",
  sufficient: "20+ угод",
  small: "Мала вибірка",
  onlySufficient: "Показати групи від 20 угод",
  minHint:
    "Групи з менш ніж 20 угодами дають попередні висновки. Рейтинг базується на історичному грошовому очікуванні, на яке можуть впливати розмір позицій і перетин факторів.",
  include: "Перевірити відбір",
  exclude: "Перевірити виключення",
  includeSelected: "Перевірити відбір будь-якої вибраної групи",
  excludeSelected: "Перевірити виключення вибраних груп",
  scenario: "Історична симуляція",
  actual: "Як було",
  simulated: "З правилом",
  kept: "Залишено угод",
  removed: "Виключено угод",
  ruleKeep: "Залишити угоди, які належать хоча б до однієї вибраної групи",
  ruleRemove: "Виключити угоди, які належать хоча б до однієї вибраної групи",
  limitation:
    "Це порівняння заднім числом на тій самій вибірці. Розглядай покращення як гіпотезу для перевірки на майбутніх угодах або незалежному бектесті.",
  noGroups: "У цій вибірці немає відповідних груп.",
  ai: "Відкрити AI Review",
};

export function useInsightMessages() {
  return useLocale().language === LANGUAGE.UKRAINIAN ? uk : en;
}
