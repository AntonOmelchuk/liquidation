import { capitalizeFirst } from "../../../shared/format.ts";
import { LANGUAGE, LOCALES } from "../../../shared/constants.ts";
import { mistakeLabel } from "../../mistakes/messages.ts";
import { TRADE_FACTOR } from "@liquidation/domain/analytics/constants";
import type { Playbook } from "@liquidation/domain/playbooks/types";
import type { Trade } from "@liquidation/domain/trades/types";
import type { AnalyticsOption } from "../../../shared/analytics/types.ts";

import {
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
  const books = new Map(playbooks.map((book) => [book.id, book]));
  const accounts = new Map(
    accountOptions.map(({ key, label }) => [key, label]),
  );
  const styles = new Map<string, string>();
  const mistakeTags = new Map<string, string>();
  for (const trade of trades) {
    const { account, mistakes } = trade;
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
      case TRADE_FACTOR.VERSION: {
        const [id, version] = key.split(":");
        const title = books.get(id)?.title ?? messages.unknown;
        return `${title} · ${version ? `v${version}` : messages.unversioned}`;
      }
      case TRADE_FACTOR.SETUP: {
        const [bookId, version, setupId] = key.split(":");
        const book = books.get(bookId);
        const name = book?.versions
          .find(({ number }) => number === Number(version))
          ?.setups.find(({ id }) => id === setupId)?.name;
        return [
          name || messages.unnamedSetup,
          book?.title ?? messages.unknown,
          "v" + version,
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
      case TRADE_FACTOR.SESSION:
        return key === TRADE_SESSION.OUTSIDE ? common.outsideSession : key;
      default:
        return key;
    }
  };
}
