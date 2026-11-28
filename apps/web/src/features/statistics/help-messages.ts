import { TRADE_FACTOR } from "@liquidation/domain/analytics/constants";
import type { TradeFactor } from "@liquidation/domain/analytics/types";
import { LANGUAGE } from "../../shared/constants.ts";
import { useLocale } from "../../shared/messages.ts";
import { TRADE_COLUMN } from "./constants.ts";
import type { TradeColumn } from "./types.ts";

const enFactors: Record<TradeFactor, string> = {
  [TRADE_FACTOR.INSTRUMENT]: "The traded symbol, such as EURUSD or XAUUSD.",
  [TRADE_FACTOR.SIDE]: "Long and short positions are compared separately.",
  [TRADE_FACTOR.ACCOUNT]:
    "The account linked to the trade. Unassigned records appear in their own group.",
  [TRADE_FACTOR.OUTCOME]:
    "Profit, loss or zero result based on net P&L after costs.",
  [TRADE_FACTOR.LIMIT_ENTRY_TEST]:
    "Whether price retested the level for a limit entry, independent of the order used.",
  [TRADE_FACTOR.ENTRY_TYPE]: "The recorded order type: market, limit or stop.",
  [TRADE_FACTOR.MISTAKE]:
    "Tags recorded on trades, such as an early entry or a rule exception. One trade can contribute to several tag groups.",
  [TRADE_FACTOR.TIMEFRAME]:
    "The timeframe of the entry setup, recorded on the trade.",
  [TRADE_FACTOR.WEEKDAY]: "The local weekday on which the trade was opened.",
  [TRADE_FACTOR.HOUR]: "The local hour of entry (00–23).",
  [TRADE_FACTOR.MONTH]:
    "Local calendar month of closing, aggregated across years; combine with a year filter to select a specific year.",
  [TRADE_FACTOR.YEAR]: "Calendar year of closing, using local time.",
  [TRADE_FACTOR.SESSION]:
    "The session or kill zone selected on the trade. Recorded labels are used.",
  [TRADE_FACTOR.DURATION]:
    "The elapsed time between entry and closing, grouped into five holding-time ranges.",
  [TRADE_FACTOR.STYLE]:
    "The recorded trading style, such as swing or intraday.",
  [TRADE_FACTOR.PLAYBOOK]: "The trading strategy linked to the trade.",
  [TRADE_FACTOR.SETUP]: "The named model or setup within a playbook.",
};

const ukFactors: Record<TradeFactor, string> = {
  [TRADE_FACTOR.INSTRUMENT]: "Торговий символ, наприклад EURUSD або XAUUSD.",
  [TRADE_FACTOR.SIDE]: "Окреме порівняння довгих і коротких позицій.",
  [TRADE_FACTOR.ACCOUNT]:
    "Торговий рахунок, прив’язаний до угоди. Записи без рахунку утворюють окрему групу.",
  [TRADE_FACTOR.OUTCOME]:
    "Прибуток, збиток або нуль за чистим P&L з урахуванням витрат.",
  [TRADE_FACTOR.LIMIT_ENTRY_TEST]:
    "Чи ціна повернулася до рівня для лімітного входу. Фактичний тип ордера враховується окремо.",
  [TRADE_FACTOR.ENTRY_TYPE]: "Записаний тип заявки: market, limit або stop.",
  [TRADE_FACTOR.MISTAKE]:
    "Теги угод, наприклад ранній вхід або порушення правила. Одна угода може належати до кількох груп помилок.",
  [TRADE_FACTOR.TIMEFRAME]: "Таймфрейм сетапу входу, вказаний в угоді.",
  [TRADE_FACTOR.WEEKDAY]: "День тижня, коли відкрито угоду, за місцевим часом.",
  [TRADE_FACTOR.HOUR]: "Година входу за місцевим часом (00–23).",
  [TRADE_FACTOR.MONTH]:
    "Календарний місяць закриття за місцевим часом, разом за всі роки. Щоб обмежити рік, використай відповідний фільтр.",
  [TRADE_FACTOR.YEAR]: "Календарний рік закриття за місцевим часом.",
  [TRADE_FACTOR.SESSION]: "Торгова сесія або kill zone, яку ти вказав в угоді.",
  [TRADE_FACTOR.DURATION]:
    "Час між відкриттям і закриттям, поділений на п’ять діапазонів тривалості.",
  [TRADE_FACTOR.STYLE]:
    "Записаний стиль торгівлі, наприклад swing або intraday.",
  [TRADE_FACTOR.PLAYBOOK]: "Торгова стратегія, прив’язана до угоди.",
  [TRADE_FACTOR.SETUP]: "Названа торгова модель або сетап в плейбуку.",
};

const enMetrics: Record<TradeColumn, string> = {
  [TRADE_COLUMN.GROUP]: "Trade group matching the selected factor.",
  [TRADE_COLUMN.OPENING]:
    "Opening balance entered when the account was created.",
  [TRADE_COLUMN.BALANCE]:
    "Opening balance plus closed net trade P&L and recorded money movements through today.",
  [TRADE_COLUMN.COUNT]: "Number of closed trades in the group.",
  [TRADE_COLUMN.WIN_RATE]:
    "Profitable trades divided by all closed trades. Zero-result trades are included in the denominator.",
  [TRADE_COLUMN.NET]:
    "Gross profit + signed commission + signed swap, summed in the journal currency.",
  [TRADE_COLUMN.PROFIT_FACTOR]:
    "Sum of positive net results divided by the absolute sum of negative net results. ∞ means gains with no losses.",
  [TRADE_COLUMN.PAYOFF]:
    "Average profitable trade divided by the absolute average losing trade (actual RR). Requires both wins and losses.",
  [TRADE_COLUMN.EXPECTANCY]: "Net P&L divided by closed trade count.",
  [TRADE_COLUMN.TOTAL_R]:
    "Sum of each trade’s net P&L divided by its recorded positive initial risk. Trades with unknown risk are excluded.",
};
const ukMetrics: Record<TradeColumn, string> = {
  [TRADE_COLUMN.GROUP]: "Група угод за вибраним фактором.",
  [TRADE_COLUMN.OPENING]: "Баланс, вказаний під час створення рахунку.",
  [TRADE_COLUMN.BALANCE]:
    "Початковий баланс плюс чистий результат закритих угод і записаний рух коштів станом на сьогодні.",
  [TRADE_COLUMN.COUNT]: "Кількість закритих угод у групі.",
  [TRADE_COLUMN.WIN_RATE]:
    "Прибуткові угоди, поділені на всі закриті угоди. Нульові угоди входять до знаменника.",
  [TRADE_COLUMN.NET]:
    "Сума валового прибутку, комісії зі знаком і свопу зі знаком у валюті журналу.",
  [TRADE_COLUMN.PROFIT_FACTOR]:
    "Сума позитивних чистих результатів, поділена на абсолютну суму негативних. ∞ означає прибутки за відсутності збитків.",
  [TRADE_COLUMN.PAYOFF]:
    "Середня прибуткова угода, поділена на абсолютний середній збиток (фактичний RR). Потрібні і прибуткові, і збиткові угоди.",
  [TRADE_COLUMN.EXPECTANCY]:
    "Чистий P&L, поділений на кількість закритих угод.",
  [TRADE_COLUMN.TOTAL_R]:
    "Сума чистих P&L кожної угоди, поділених на її записаний додатний початковий ризик. Угоди з невідомим ризиком пропускаються.",
};
export function useStatisticsHelp() {
  const uk = useLocale().language === LANGUAGE.UKRAINIAN;
  return {
    factors: uk ? ukFactors : enFactors,
    metrics: uk ? ukMetrics : enMetrics,
  };
}
