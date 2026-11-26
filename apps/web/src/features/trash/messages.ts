import { LANGUAGE } from "../../shared/constants.ts";
import { useLocale } from "../../shared/messages.ts";

const en = {
  trash: "Trash",
  delete: "Delete",
  confirm: "Move to trash?",
  explanation:
    "The record is removed from the active journal and can be restored from Trash.",
  move: "Move to trash",
  restore: "Restore",
  restored: "Record restored.",
  error:
    "Could not change this record. Check for a more recent version or an existing record using the same date.",
  empty: "Trash is empty.",
  kind: "Record type",
  removed: "Removed at",
  deleted: "In trash",
  trade: "Closed trade",
  position: "Open position",
  plan: "Plan",
  playbook: "Playbook",
  backtest: "Backtest",
  learning: "Learning entry",
  highlight: "Best trade example",
  report: "Review",
  preparation: "Thoughts and tasks",
  thought: "Daily thoughts",
  watchlist: "Weekly watchlist",
  missed: "Missed trade",
  account: "Account",
  movement: "Money movement",
  purge: "Delete permanently",
  purgeConfirm: "Permanently delete this record?",
  purgeExplanation:
    "This deletes the record and its unreferenced images permanently. It cannot be restored.",
  purged: "Record permanently deleted.",
  purgeError:
    "Unable to delete. Remove references from related records (including those in Trash) before trying again.",
};
const uk: typeof en = {
  trash: "Кошик",
  delete: "Видалити",
  confirm: "Перемістити в кошик?",
  explanation:
    "Запис зникне з активного журналу. Його можна відновити з кошика.",
  move: "Перемістити в кошик",
  restore: "Відновити",
  restored: "Запис відновлено.",
  error:
    "Не вдалося змінити запис. Перевір, чи він не був змінений або чи дата вже зайнята іншим записом.",
  empty: "Кошик порожній.",
  kind: "Тип запису",
  removed: "Дата видалення",
  deleted: "У кошику",
  trade: "Закрита угода",
  position: "Відкрита позиція",
  plan: "План",
  playbook: "Плейбук",
  backtest: "Бектест",
  learning: "Навчальний запис",
  highlight: "Приклад угоди",
  report: "Рев’ю",
  preparation: "Думки й справи",
  thought: "Думки на день",
  watchlist: "Watchlist на тиждень",
  missed: "Пропущена угода",
  account: "Рахунок",
  movement: "Рух коштів",
  purge: "Видалити остаточно",
  purgeConfirm: "Видалити запис остаточно?",
  purgeExplanation:
    "Запис і його зображення, які більше ніде не використовуються, буде видалено. Відновлення неможливе.",
  purged: "Запис видалено остаточно.",
  purgeError:
    "Не вдалося видалити. Спочатку прибери посилання з пов’язаних записів, зокрема записів у кошику.",
};

export function useTrashMessages() {
  return useLocale().language === LANGUAGE.UKRAINIAN ? uk : en;
}
