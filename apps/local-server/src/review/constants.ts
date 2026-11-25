export const REVIEW_MODEL_ENABLED = "1";
export const REVIEW_MODEL_NAME = "liquidation-review";
export const REVIEW_MODEL_PORT = 17840;
export const REVIEW_MODEL_PATH = "/v1/chat/completions";
export const REVIEW_MODEL_RESPONSE_LIMIT = 64 * 1024;
export const REVIEW_MODEL_TIMEOUT_MS = 150_000;
export const REVIEW_MODEL_MAX_TOKENS = 800;

export const REVIEW_SYSTEM_PROMPT = [
  "Ти аналізуєш історичну статистику торгового журналу. Відповідай українською.",
  "Кожна гіпотеза має спиратися на один ідентифікатор факту з отриманої вибірки.",
  "Сформулюй коротку якісну гіпотезу або запитання для наступних спостережень. Не додавай цифр, відсотків, цін, назв інструментів чи прогнозів.",
  "Познач обережно, якщо вибірка мала. Уникай обіцянок результату та рекомендацій купувати або продавати.",
  "Поверни лише об'єкт JSON із масивом insights. Кожен елемент містить evidenceId та hypothesis.",
].join(" ");
