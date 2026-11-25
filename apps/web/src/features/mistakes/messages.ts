import { MISTAKE_PRESET } from "@liquidation/domain/trades/constants";
import { tradeTagKey } from "@liquidation/domain/trades/trade-tags";
import { LANGUAGE } from "../../shared/constants.ts";
import { useLocale } from "../../shared/messages.ts";

const en = {
  title: "Mistake analytics",
  nav: "Mistakes",
  review: "Trade review",
  reviewed: "Review completed",
  reviewHint:
    "Select every observed mistake. Mark an exception as critical when it breaches an essential risk or strategy rule. Add your own labels if needed.",
  critical: "Critical",
  custom: "Custom mistake",
  add: "Add",
  limit: "Up to 10 mistakes per trade.",
  reviewNotes: "Review notes & lesson",
  notesPlaceholder: "What happened, what to change next time?",
  unreviewed: "Awaiting review",
  noMistakes: "Reviewed without mistakes",
  recorded: "Mistakes recorded",
  count: "Occurrences",
  affected: "Trades with mistakes",
  criticalTrades: "Trades with critical mistakes",
  coverage: "Reviewed trades",
  occurrenceRate: "Share of reviewed trades",
  associatedNet: "Associated net P&L",
  loss: "Associated losses",
  latest: "Latest reviewed trades",
  previous: "Previous reviewed trades",
  direction: "Trend",
  increased: "Increasing",
  decreased: "Decreasing",
  stable: "Unchanged",
  noComparison: "Insufficient history",
  recurrence: "Recurring mistakes",
  summary: "Mistakes by type",
  day: "Date",
  weekday: "Day of week",
  month: "Month",
  byDay: "Daily mistake history",
  byWeekday: "Mistakes by weekday",
  byMonth: "Monthly mistake history",
  trendTitle: "Mistake frequency over time",
  allTags: "All mistakes",
  inspect: "Inspect trades",
  selection: "Mistake focus",
  noHistory: "Review closed trades to build your mistake history.",
  noRows: "No recorded mistakes in this selection.",
  sampleHint:
    "Trend compares the latest 20 reviewed closed trades with the preceding 20. The denominator is reviewed trades in each sample. Partial samples are provisional.",
  metricHint:
    "Each tag counts at most once per trade. A trade can have several tags. P&L is the result associated with the tagged trades; it does not establish the cause of a loss.",
  dateHint:
    "Date filters and periods use local closing dates. Weekday uses local entry time.",
  focusHint:
    "The daily and monthly tables show the frequency of the selected mistake across all reviewed trades in each period.",
  reviewTrade: "Review trade",
};

const uk: typeof en = {
  title: "Аналітика помилок",
  nav: "Помилки",
  review: "Рев’ю угоди",
  reviewed: "Рев’ю завершено",
  reviewHint:
    "Познач усі зафіксовані помилки. Позначай виняток критичним, якщо він порушує основне правило ризику або стратегії. Можна додавати власні назви.",
  critical: "Критична",
  custom: "Власна помилка",
  add: "Додати",
  limit: "До 10 помилок на угоду.",
  reviewNotes: "Висновки й уроки рев’ю",
  notesPlaceholder: "Що сталося і що варто змінити наступного разу?",
  unreviewed: "Очікує рев’ю",
  noMistakes: "Рев’ю без помилок",
  recorded: "Зафіксовано помилки",
  count: "Повторень",
  affected: "Угоди з помилками",
  criticalTrades: "Угоди з критичними помилками",
  coverage: "Угоди з рев’ю",
  occurrenceRate: "Частка угод з рев’ю",
  associatedNet: "Пов’язаний чистий P&L",
  loss: "Пов’язані збитки",
  latest: "Останні угоди з рев’ю",
  previous: "Попередні угоди з рев’ю",
  direction: "Динаміка",
  increased: "Частішає",
  decreased: "Зменшується",
  stable: "Без змін",
  noComparison: "Бракує історії",
  recurrence: "Повторювані помилки",
  summary: "Помилки за типами",
  day: "Дата",
  weekday: "День тижня",
  month: "Місяць",
  byDay: "Помилки за днями",
  byWeekday: "Помилки за днями тижня",
  byMonth: "Помилки за місяцями",
  trendTitle: "Динаміка частоти помилок",
  allTags: "Усі помилки",
  inspect: "Переглянути угоди",
  selection: "Фокус на помилці",
  noHistory: "Проведи рев’ю закритих угод, щоб сформувати історію помилок.",
  noRows: "У цій вибірці немає записаних помилок.",
  sampleHint:
    "Динаміка порівнює 20 останніх закритих угод з рев’ю і 20 попередніх. Знаменник — кількість угод з рев’ю у відповідній вибірці. Для неповної вибірки висновок попередній.",
  metricHint:
    "Кожен тег враховується один раз на угоду. Одна угода може мати кілька тегів. P&L показує результат пов’язаних угод, причину збитку потрібно оцінювати окремо.",
  dateHint:
    "Фільтри та періоди використовують місцеві дати закриття. День тижня визначено за часом входу.",
  focusHint:
    "Денні й місячні таблиці показують частоту вибраної помилки серед усіх угод з рев’ю за відповідний період.",
  reviewTrade: "Рев’ю угоди",
};

const presetTranslations = new Map(
  [
    [MISTAKE_PRESET.EARLY_ENTRY, "Ранній вхід"],
    [MISTAKE_PRESET.LATE_ENTRY, "Пізній вхід"],
    [MISTAKE_PRESET.NO_SETUP, "Вхід без сетапу"],
    [MISTAKE_PRESET.OUTSIDE_PLAN, "Поза торговим планом"],
    [MISTAKE_PRESET.FOMO, "FOMO"],
    [MISTAKE_PRESET.REVENGE, "Реванш-трейдинг"],
    [MISTAKE_PRESET.OVERTRADING, "Надмірна торгівля"],
    [MISTAKE_PRESET.EXCESS_RISK, "Перевищення ризику"],
    [MISTAKE_PRESET.MOVED_STOP, "Віддалив стоп"],
    [MISTAKE_PRESET.EARLY_EXIT, "Ранній вихід"],
    [MISTAKE_PRESET.MISSED_EXIT, "Пропустив запланований вихід"],
    [MISTAKE_PRESET.NEWS, "Проігнорував новини"],
    [MISTAKE_PRESET.SESSION, "Поза торговою сесією"],
    [MISTAKE_PRESET.RULE_VIOLATION, "Порушення правила"],
  ].map(([key, label]) => [tradeTagKey(key), label]),
);

export function mistakeLabel(label: string, language: string) {
  return language === LANGUAGE.UKRAINIAN
    ? (presetTranslations.get(tradeTagKey(label)) ?? label)
    : label;
}

export function useMistakeMessages() {
  return useLocale().language === LANGUAGE.UKRAINIAN ? uk : en;
}
