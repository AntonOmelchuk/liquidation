import { INSTRUMENT_MARKET } from "@liquidation/domain/instruments/constants";
import { HIGHLIGHT_TYPE } from "@liquidation/domain/workspace/constants";
import { LANGUAGE } from "../../../shared/constants.ts";
import { useLocale } from "../../../shared/messages.ts";

const en = {
  date: "Date",
  market: "Market",
  style: "Style",
  timeframe: "TF",
  model: "Model",
  playbook: "Playbook",
  rr: "RR",
  plannedRR: "Planned reward-to-risk",
  type: "Type",
  actions: "Actions",
  autoMarket: "Automatic",
  tradeDetails: "Trade details",
  viewJournalTrade: "Open journal trade",
  analysis: "Timeframe analysis",
  missing: "Trade example not found.",
  markets: {
    [INSTRUMENT_MARKET.FOREX]: "Forex",
    [INSTRUMENT_MARKET.INDICES]: "Indices",
    [INSTRUMENT_MARKET.COMMODITIES]: "Commodities",
    [INSTRUMENT_MARKET.EQUITIES]: "Equities",
    [INSTRUMENT_MARKET.CRYPTO]: "Crypto",
    [INSTRUMENT_MARKET.OTHER]: "Other",
  },
  types: {
    [HIGHLIGHT_TYPE.REVERSAL]: "Reversal",
    [HIGHLIGHT_TYPE.CONTINUATION]: "Continuation",
  },
};

const uk: typeof en = {
  date: "Дата",
  market: "Ринок",
  style: "Стиль",
  timeframe: "ТФ",
  model: "Модель",
  playbook: "Плейбук",
  rr: "RR",
  plannedRR: "Планове співвідношення прибутку до ризику",
  type: "Тип",
  actions: "Дії",
  autoMarket: "Автоматично",
  tradeDetails: "Деталі угоди",
  viewJournalTrade: "Відкрити угоду в журналі",
  analysis: "Аналіз за таймфреймами",
  missing: "Приклад угоди не знайдено.",
  markets: {
    [INSTRUMENT_MARKET.FOREX]: "Forex",
    [INSTRUMENT_MARKET.INDICES]: "Індекси",
    [INSTRUMENT_MARKET.COMMODITIES]: "Сировина",
    [INSTRUMENT_MARKET.EQUITIES]: "Акції",
    [INSTRUMENT_MARKET.CRYPTO]: "Крипто",
    [INSTRUMENT_MARKET.OTHER]: "Інше",
  },
  types: {
    [HIGHLIGHT_TYPE.REVERSAL]: "Розворот",
    [HIGHLIGHT_TYPE.CONTINUATION]: "Продовження",
  },
};

export function useHighlightMessages() {
  return useLocale().language === LANGUAGE.UKRAINIAN ? uk : en;
}
