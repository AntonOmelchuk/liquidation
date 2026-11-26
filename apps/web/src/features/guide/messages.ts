import { LANGUAGE } from "../../shared/constants.ts";
import { useLocale } from "../../shared/messages.ts";

const en = {
  title: "Journal guide",
  nav: "Guide",
  introduction:
    "A practical reference for recording decisions, connecting trades to strategies and reviewing performance in Liquidation.",
  workflow: "Daily and weekly workflow",
  factors: "Trade grouping and filters",
  calculations: "Performance metrics",
  statistics: "Working with statistics",
  statisticsSteps: [
    "Choose the closing-date range and account. Open any filter category to restrict the selection further. Remove a filter using its chip, or reset the entire selection.",
    "Use Overview to compare the main dimensions. Check any rows for a unique-trade subtotal. The month table combines each calendar month across all years. Click a table header to change sorting. Select a group name to inspect the trades behind its numbers.",
    "Use Trade breakdown for one factor, including entry hour, trade outcome, strategy version and holding time. The grouped dropdown changes the dimension being compared. It leaves every active filter in place.",
    "Review the performance curves, drawdown, distribution of R, period summaries and rule adherence below. The actual-versus-potential scenario uses all trades and assessed misses in the selected date range.",
    "Open Trading insights to compare profitable and losing groups, then test historical inclusion or exclusion rules. Samples below 20 trades are preliminary.",
    "Open Mistakes for recurrence, critical exceptions, review coverage and changes across the latest and previous reviewed trades.",
    "Compare sample counts along with WR, RR and profit factor. Very small groups can be dominated by a single trade.",
  ],
  journal: "Journal",
  journalText:
    "Use Record trade to log an open position. For historical trades, choose Record a closed trade above the closed-trade table. Complete the account, risk, timeframe, session, strategy and setup for useful comparisons. The compact ledger opens a detail window by clicking a row. Open and close positions on dedicated full-page forms, attach entry and exit charts, and record skipped-rule explanations. Review closed trades from their detail window, select mistakes and mark critical exceptions. Open positions can be moved to breakeven from their details. Group closed trades by week, month or quarter.",
  preparation: "Thoughts and tasks",
  preparationText:
    "Use Today's thoughts and This week's thoughts for market observations, news, expectations and tasks. Check off tasks from the dashboard. Complete the DRC after the session and the WRC after the trading week from the separate review panel. Prepare the weekly Watchlist with instruments, ideas and plans, then review it at the end of the week.",
  accounts: "Accounts",
  accountsText:
    "Create the account before recording trades. Record deposits, payouts, fees and corrections as money movements. Balance includes these movements, while trade P&L tracks closed trade results. Account rules use recorded funding and stop risk.",
  plans: "Plans",
  plansText:
    "Create a dated plan with chart examples, analysis blocks, a playbook and intended risk. Link existing trades or choose the plan when recording a position. Update its status, reason and review after the opportunity. Add assessed missed entries when appropriate.",
  strategies: "Playbooks",
  strategiesText:
    "Choose a template, define setups and rules, add chart examples and review your execution. Link trades and plans to a specific strategy version and setup. Checklists and setup examples are retained with that version.",
  backtests: "Backtests",
  backtestsText:
    "Create a separate backtest for a strategy, record manual samples, risk, result and notes, and examine the sample's performance. Backtest samples have their own statistics.",
  reviews: "Cards, reports and AI review",
  reviewsText:
    "Complete daily (DRC) and weekly (WRC) cards with goals, process, mistakes and trade assessments. Use Reports for monthly and quarterly reviews and the latest 20 closed trades. AI Review calculates journal metrics and supports what-if questions using the recorded history.",
  learning: "Notes, lectures and best trades",
  learningText:
    "Keep notes independent of lecture course blocks. Add images and examples to each lecture. Curate Best trades from your journal or create standalone setup examples to review before trading.",
  trash: "Trash and local data",
  trashText:
    "Delete a record to move it to Trash, where it can be restored or permanently deleted. Review linked history before permanent deletion. Journal data and attached images are stored on your computer. Keep a backup of the local journal directory.",
  settings: "Appearance and language",
  settingsText:
    "Use Settings in the top navigation to select English or Ukrainian, switch the theme and increase text size.",
};
const uk: typeof en = {
  title: "Посібник журналу",
  nav: "Посібник",
  introduction:
    "Практичний довідник із запису рішень, зв’язування угод зі стратегіями та аналізу результатів у Liquidation.",
  workflow: "Щоденна й щотижнева робота",
  factors: "Групування й фільтри угод",
  calculations: "Показники результативності",
  statistics: "Робота зі статистикою",
  statisticsSteps: [
    "Обери дати закриття та рахунок. Відкрий категорію фільтрів для уточнення вибірки. Зніми окремий фільтр натисканням на його позначку або скинь усі разом.",
    "В огляді порівнюй основні фактори в окремих таблицях. Позначай рядки для підсумку вибраних угод. Таблиця місяців об’єднує однойменні місяці всіх років. Натисни на заголовок колонки для зміни сортування. Натисни на назву групи, щоб побачити угоди, з яких отримано цифри.",
    "У розбивці угод аналізуй один фактор, зокрема годину входу, результат угоди, версію стратегії або час утримання. Меню групування змінює фактор порівняння і зберігає всі активні фільтри.",
    "Нижче переглянь криві результатів, просадку, розподіл R, підсумки за періодами та дотримання правил. Сценарій фактичного й потенційного результату використовує всі угоди та оцінені пропуски за вибрані дати.",
    "Відкрий «Висновки», щоб порівняти прибуткові й збиткові групи та перевірити історичний відбір або виключення. Вибірки до 20 угод дають попередні висновки.",
    "Відкрий «Помилки» для аналізу повторень, критичних винятків, повноти рев’ю та зміни частоти між останніми й попередніми угодами.",
    "Порівнюй розмір вибірки разом із WR, RR і фактором прибутку. На результат малої групи може суттєво впливати одна угода.",
  ],
  journal: "Журнал",
  journalText:
    "Натисни «Записати угоду», щоб додати відкриту позицію. Для історичних угод скористайся кнопкою «Записати закриту угоду» над таблицею закритих угод. Вкажи рахунок, ризик, таймфрейм, сесію, стратегію та сетап для детального аналізу. Натисни на рядок компактної таблиці, щоб відкрити деталі. Відкривай, редагуй і закривай позиції на окремих сторінках, додавай скріншоти входу й виходу та пояснення пропущених правил. У рев’ю закритої угоди позначай помилки й критичні винятки. У деталях позиції можна перевести стоп у BE. Групуй історію за тижнями, місяцями або кварталами.",
  preparation: "Думки й справи",
  preparationText:
    "У блоці «Думки на сьогодні» або «Думки на тиждень» записуй спостереження, новини, очікування й справи. Відмічай справи прямо на дашборді. В окремому блоці рев’ю заповнюй DRC наприкінці торгового дня та WRC наприкінці тижня. Підготуй Watchlist з інструментами, ідеями й планами та переглянь його наприкінці тижня.",
  accounts: "Рахунки",
  accountsText:
    "Створи рахунок перед записом угод. Реєструй поповнення, виплати, комісії й коригування як рух коштів. Баланс враховує ці операції, а торговий P&L відображає закритий результат. Правила рахунку використовують записане фінансування й ризик до стопів.",
  plans: "Плани",
  plansText:
    "Створи датований план з прикладами графіків, блоками аналізу, плейбуком і запланованим ризиком. Прив’яжи наявні угоди або обери план під час запису позиції. Після можливості онови статус, причину й рев’ю. Додавай оцінені пропущені входи, коли це потрібно.",
  strategies: "Плейбуки",
  strategiesText:
    "Обери шаблон, опиши сетапи та правила, додай приклади графіків і проаналізуй виконання. Прив’язуй угоди й плани до версії стратегії та сетапу. Чеклісти й приклади сетапів зберігаються з відповідною версією.",
  backtests: "Бектести",
  backtestsText:
    "Створи окремий бектест для стратегії, записуй тестові угоди, ризик, результат і нотатки, переглядай результативність вибірки. Бектести мають власну статистику.",
  reviews: "Картки, звіти й AI Review",
  reviewsText:
    "Заповнюй денні (DRC) і тижневі (WRC) картки з цілями, процесом, помилками та оцінкою угод. У звітах проводь місячні й квартальні рев’ю та аналіз останніх 20 закритих угод. AI Review розраховує показники й підтримує питання «що було б, якби» за записаною історією.",
  learning: "Нотатки, лекції та найкращі угоди",
  learningText:
    "Веди нотатки окремо від навчальних блоків. Додавай до кожної лекції зображення та приклади. Збирай найкращі угоди з журналу або створюй окремі приклади сетапів для перегляду перед торгівлею.",
  trash: "Кошик і локальні дані",
  trashText:
    "Після видалення запис можна відновити або остаточно видалити з кошика. Перед остаточним видаленням перевір пов’язану історію. Дані журналу й зображення зберігаються на твоєму комп’ютері. Зберігай резервні копії локальної папки журналу.",
  settings: "Оформлення й мова",
  settingsText:
    "У налаштуваннях верхнього меню обирай українську або англійську мову, змінюй тему та збільшуй текст.",
};

export function useGuideMessages() {
  return useLocale().language === LANGUAGE.UKRAINIAN ? uk : en;
}
