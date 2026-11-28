import { tradeRecordMessages } from "../../journal/records/messages.ts";
import { tradePlaybookRules } from "@liquidation/domain/playbooks/playbook";
import { capitalizeFirst } from "../../../shared/format.ts";
import { LANGUAGE, LOCALES } from "../../../shared/constants.ts";
import { mistakeLabel } from "../../mistakes/messages.ts";
import { TRADE_FACTOR } from "@liquidation/domain/analytics/constants";
import type { Playbook } from "@liquidation/domain/playbooks/types";
import type { Trade } from "@liquidation/domain/trades/types";
import type { AnalyticsOption } from "../../../shared/analytics/types.ts";

import {
  ENTRY_TEST,
  ENTRY_TYPE,
  TRADE_SESSION,
  TRADE_SIDE,
} from "@liquidation/domain/trades/constants";
import {
  tradeAccountKey,
  tradeTagKey,
} from "@liquidation/domain/trades/trade-tags";

import type {
  CommonMessages,
  FactorLabel,
  StatisticsMessages,
} from "../types.ts";

export function createFactorLabels(
  trades: readonly Trade[],
  playbooks: readonly Playbook[],
  locale: string,
  common: CommonMessages,
  messages: StatisticsMessages,
  accountOptions: readonly AnalyticsOption[],
): FactorLabel {
  const language =
    locale === LOCALES[LANGUAGE.UKRAINIAN]
      ? LANGUAGE.UKRAINIAN
      : LANGUAGE.ENGLISH;
  const tests = tradeRecordMessages(language);
  const books = new Map(playbooks.map((book) => [book.id, book]));
  const setups = new Map<string, string>();
  const accounts = new Map(
    accountOptions.map(({ key, label }) => [key, label]),
  );
  const styles = new Map<string, string>();
  const mistakeTags = new Map<string, string>();
  for (const trade of trades) {
    const { account, mistakes, playbook } = trade;
    if (playbook?.setupId) {
      const book = books.get(playbook.id);
      const name =
        book?.rules.setups.find(({ id }) => id === playbook.setupId)?.name ??
        tradePlaybookRules(book, playbook)?.setupName;
      const key = playbook.id + ":" + playbook.setupId;
      if (name !== undefined && !setups.has(key)) setups.set(key, name);
    }
    const accountKey = tradeAccountKey(trade);
    if (account && !accounts.has(accountKey)) accounts.set(accountKey, account);
    if (trade.style && !styles.has(tradeTagKey(trade.style)))
      styles.set(tradeTagKey(trade.style), trade.style);
    for (const tag of mistakes ?? []) {
      const key = tradeTagKey(tag);
      if (!mistakeTags.has(key)) mistakeTags.set(key, tag);
    }
  }
  const weekday = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    timeZone: "UTC",
  });
  const month = new Intl.DateTimeFormat(locale, {
    month: "long",
    timeZone: "UTC",
  });

  return (factor, key) => {
    if (!key)
      return factor === TRADE_FACTOR.ACCOUNT
        ? (accounts.get(key) ?? messages.unknown)
        : factor === TRADE_FACTOR.MISTAKE
          ? messages.noMistakes
          : messages.unknown;
    switch (factor) {
      case TRADE_FACTOR.PLAYBOOK:
        return books.get(key)?.title ?? messages.unknown;
      case TRADE_FACTOR.SETUP: {
        const [bookId] = key.split(":");
        return [
          setups.get(key) || messages.unnamedSetup,
          books.get(bookId)?.title ?? messages.unknown,
        ].join(" · ");
      }
      case TRADE_FACTOR.WEEKDAY:
        // January 1, 2024 is a Monday. UTC preserves the weekday index.
        return capitalizeFirst(
          weekday.format(new Date(Date.UTC(2024, 0, Number(key)))),
          locale,
        );
      case TRADE_FACTOR.HOUR:
        return `${key}:00–${key}:59`;
      case TRADE_FACTOR.MONTH:
        return capitalizeFirst(
          month.format(new Date(Date.UTC(2024, Number(key) - 1, 1))),
          locale,
        );
      case TRADE_FACTOR.DURATION:
        return (
          Object.entries(messages.durations).find(
            ([value]) => value === key,
          )?.[1] ?? key
        );
      case TRADE_FACTOR.OUTCOME:
        return (
          Object.entries(messages.outcomes).find(
            ([value]) => value === key,
          )?.[1] ?? key
        );
      case TRADE_FACTOR.SIDE:
        return key === TRADE_SIDE.LONG ? common.long : common.short;
      case TRADE_FACTOR.ENTRY_TYPE: {
        const type = Object.values(ENTRY_TYPE).find((value) => value === key);
        return type ? common[type] : key;
      }
      case TRADE_FACTOR.ACCOUNT:
        return accounts.get(key) ?? key;
      case TRADE_FACTOR.STYLE:
        return styles.get(key) ?? key;
      case TRADE_FACTOR.MISTAKE:
        return mistakeLabel(
          mistakeTags.get(key) ?? key,
          locale === LOCALES[LANGUAGE.UKRAINIAN]
            ? LANGUAGE.UKRAINIAN
            : LANGUAGE.ENGLISH,
        );
      case TRADE_FACTOR.LIMIT_ENTRY_TEST:
        return key === ENTRY_TEST.RETESTED
          ? tests.entryTestYes
          : tests.entryTestNo;
      case TRADE_FACTOR.SESSION:
        return key === TRADE_SESSION.OUTSIDE ? common.outsideSession : key;
      default:
        return key;
    }
  };
}
