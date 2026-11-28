import { LANGUAGE } from "../../shared/constants.ts";
import { useLocale } from "../../shared/messages.ts";

const en = {
  title: "Backtests",
  new: "New backtest",
  edit: "Edit backtest",
  open: "Open backtest",
  source: "Source",
  measured: "Trades with R",
  save: "Save backtest",
  back: "All backtests",
  backToSession: "Back to backtest",
  empty: "No backtests yet.",
  missing: "Backtest not found.",
  name: "Session name",
  thesis: "Hypothesis and conditions",
  samples: "Simulated trades",
  noSamples: "No simulated trades yet.",
  sampleDetail: "Simulated trade",
  sampleMissing: "Simulated trade not found.",
  addSample: "Add simulated trade",
  editSample: "Edit simulated trade",
  saveSample: "Save simulated trade",
  entryPrice: "Entry price",
  stopPrice: "Initial stop",
  exitPrice: "Exit price",
  costsR: "Trading costs in R",
  invalid:
    "Check the prices, dates and required fields. The initial stop must be on the loss side of entry.",
  conflict:
    "This backtest changed in another tab. Reload the journal before editing again.",
  saveError: "Could not save the backtest. Your changes are still in the form.",
  noPlaybook: "No playbook",
  playbook: "Playbook",
  comparison: "Backtest versus journal",
  backtest: "Backtest",
  actual: "Actual trades with this playbook",
  expectancy: "Average R",
};

const uk: Record<keyof typeof en, string> = {
  title: "Бектести",
  new: "Новий бектест",
  edit: "Редагувати бектест",
  open: "Відкрити бектест",
  source: "Вибірка",
  measured: "Угоди з R",
  save: "Зберегти бектест",
  back: "Усі бектести",
  backToSession: "До бектесту",
  empty: "Бектестів ще немає.",
  missing: "Бектест не знайдено.",
  name: "Назва сесії",
  thesis: "Гіпотеза й умови тесту",
  samples: "Тестові угоди",
  noSamples: "Тестових угод ще немає.",
  sampleDetail: "Тестова угода",
  sampleMissing: "Тестову угоду не знайдено.",
  addSample: "Додати тестову угоду",
  editSample: "Редагувати тестову угоду",
  saveSample: "Зберегти тестову угоду",
  entryPrice: "Ціна входу",
  stopPrice: "Початковий стоп",
  exitPrice: "Ціна виходу",
  costsR: "Торгові витрати в R",
  invalid:
    "Перевір ціни, дати й обов’язкові поля. Початковий стоп має бути на збитковому боці від входу.",
  conflict:
    "Цей бектест змінився в іншій вкладці. Перезавантаж журнал перед редагуванням.",
  saveError: "Не вдалося зберегти бектест. Зміни залишилися у формі.",
  noPlaybook: "Без плейбука",
  playbook: "Плейбук",
  comparison: "Бектест і фактичний журнал",
  backtest: "Бектест",
  actual: "Фактичні угоди за цим плейбуком",
  expectancy: "Середній R",
};

export function useBacktestMessages() {
  return useLocale().language === LANGUAGE.UKRAINIAN ? uk : en;
}
