import { LANGUAGE } from "../../shared/constants.ts";
import { useLocale } from "../../shared/messages.ts";

const en = {
  title: "Journal backup",
  description:
    "A local ZIP contains the journal, its attached screenshots and Trash.",
  download: "Download backup",
  choose: "Restore from backup",
  checking: "Checking archive…",
  restoring: "Restoring journal…",
  preview: "Archive contents",
  confirm:
    "This replaces the current journal. Liquidation saves a backup of the current data first.",
  replace: "Replace local journal",
  restored: "Journal restored.",
  downloadSafety: "Download the pre-restore backup",
  missing: "Missing screenshots in this backup",
  invalid: "This ZIP is damaged or uses an unsupported backup format.",
  conflict: "The journal or preview has changed. Choose the ZIP again.",
  tooLarge: "The backup exceeds the supported size.",
  failed: "The backup operation failed. Try again.",
  accounts: "Accounts",
  trades: "Closed trades",
  positions: "Open positions",
  plans: "Plans",
  playbooks: "Playbooks",
  backtests: "Backtests",
  learning: "Notes and lectures",
  newsReactions: "News reactions",
  screenshots: "Screenshots",
  trash: "In Trash",
};

const uk: typeof en = {
  title: "Резервна копія журналу",
  description: "Локальний ZIP містить журнал, прикріплені скріншоти та кошик.",
  download: "Завантажити резервну копію",
  choose: "Відновити з копії",
  checking: "Перевіряємо архів…",
  restoring: "Відновлюємо журнал…",
  preview: "Вміст архіву",
  confirm:
    "Журнал буде замінено даними з архіву. Перед цим Liquidation збереже резервну копію поточних даних.",
  replace: "Замінити локальний журнал",
  restored: "Журнал відновлено.",
  downloadSafety: "Завантажити копію до відновлення",
  missing: "Відсутні скріншоти в цій копії",
  invalid: "ZIP пошкоджений або має непідтримуваний формат резервної копії.",
  conflict: "Журнал або попередній перегляд змінився. Обери ZIP ще раз.",
  tooLarge: "Розмір резервної копії перевищує підтримувану межу.",
  failed: "Не вдалося виконати операцію з копією. Спробуй ще раз.",
  accounts: "Рахунки",
  trades: "Закриті угоди",
  positions: "Відкриті позиції",
  plans: "Плани",
  playbooks: "Плейбуки",
  backtests: "Бектести",
  learning: "Нотатки й лекції",
  newsReactions: "Реакції на новини",
  screenshots: "Скріншоти",
  trash: "У кошику",
};

export function useBackupMessages() {
  return useLocale().language === LANGUAGE.UKRAINIAN ? uk : en;
}
