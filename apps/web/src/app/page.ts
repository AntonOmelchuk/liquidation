import {
  LEARNING_KIND,
  PERIOD,
  PERIODS,
} from "@liquidation/domain/workspace/constants";
import { periodBounds } from "@liquidation/domain/workspace/period";
import type {
  LearningKind,
  ReviewPeriod,
} from "@liquidation/domain/workspace/types";
import { workspaceDaySchema } from "@liquidation/domain/workspace/workspace";
import { useSyncExternalStore } from "react";
import {
  LEGACY_LEARNING_HREF,
  NEW_BACKTEST_HREF,
  NEW_PLAN_HREF,
  NEW_PLAYBOOK_HREF,
  NEW_TRADE_HREF,
  OPEN_POSITION_HREF,
  PAGE,
  PAGE_HASHES,
  PAGE_VIEW,
  RECENT_REVIEW_HREF,
} from "./constants.ts";
import type { Route } from "./types.ts";

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

function currentHash() {
  return window.location.hash;
}

export function planHref(
  id: string,
  view?:
    typeof PAGE_VIEW.EDIT | typeof PAGE_VIEW.REVIEW | typeof PAGE_VIEW.TRADES,
) {
  const record = `${PAGE_HASHES.plans}/${id}`;
  if (!view) return record;
  return view === PAGE_VIEW.EDIT
    ? `${record}/${PAGE_VIEW.EDIT}`
    : `${record}/${PAGE_VIEW.EDIT}/${view}`;
}

export function playbookHref(id: string, editing = false) {
  return `${PAGE_HASHES.playbooks}/${id}${editing ? `/${PAGE_VIEW.EDIT}` : ""}`;
}

export function backtestHref(id: string, editing = false) {
  return `${PAGE_HASHES.backtests}/${id}${editing ? `/${PAGE_VIEW.EDIT}` : ""}`;
}

export function positionEditHref(
  id: string,
  view: typeof PAGE_VIEW.EDIT | typeof PAGE_VIEW.CLOSE,
) {
  return `${PAGE_HASHES.journal}/${id}/${view}`;
}

export function tradeLinksHref(id: string) {
  return `${PAGE_HASHES.journal}/${id}/${PAGE_VIEW.LINKS}`;
}

export function reportHref(period: ReviewPeriod, date: string) {
  return (
    PAGE_HASHES.reports + "/" + period + "/" + periodBounds(period, date).start
  );
}

export function learningHref(kind: LearningKind, id?: string, editing = false) {
  const root =
    kind === LEARNING_KIND.LESSON ? PAGE_HASHES.lectures : PAGE_HASHES.notes;
  return id ? root + "/" + id + (editing ? "/" + PAGE_VIEW.EDIT : "") : root;
}

export function thoughtHref(day: string) {
  return PAGE_HASHES.thoughts + "/" + day;
}
export function watchlistHref(day: string) {
  return PAGE_HASHES.watchlist + "/" + periodBounds(PERIOD.WEEK, day).start;
}

export function accountHref(id: string) {
  return PAGE_HASHES.accounts + "/" + id;
}
export function statisticsHref(accountId: string) {
  return PAGE_HASHES.statistics + "/" + accountId;
}
export function cardsHref(day: string) {
  return PAGE_HASHES.cards + "/" + periodBounds(PERIOD.QUARTER, day).start;
}

export function routeFor(hash: string): Route {
  if (hash === PAGE_HASHES.mistakes) return { page: PAGE.MISTAKES };
  if (hash === NEW_TRADE_HREF)
    return { page: PAGE.JOURNAL, view: PAGE_VIEW.NEW };
  if (hash === OPEN_POSITION_HREF)
    return { page: PAGE.JOURNAL, view: PAGE_VIEW.OPEN };
  if (hash === PAGE_HASHES.guide) return { page: PAGE.GUIDE };
  if (hash === PAGE_HASHES.trash) return { page: PAGE.TRASH };
  if (hash === PAGE_HASHES.statistics) return { page: PAGE.STATISTICS };
  if (hash === PAGE_HASHES.review) return { page: PAGE.REVIEW };
  if (hash === LEGACY_LEARNING_HREF)
    return { page: PAGE.LECTURES, view: PAGE_VIEW.LIST };
  if (hash === PAGE_HASHES[PAGE.BEST_TRADES]) return { page: PAGE.BEST_TRADES };
  if (hash === RECENT_REVIEW_HREF) return { page: PAGE.REPORTS, recent: true };
  const [page, id, action, section, ...rest] = hash.split("/");
  if (rest.length === 0) {
    if (page === PAGE_HASHES.accounts && !action && !section)
      return { page: PAGE.ACCOUNTS, id };
    if (page === PAGE_HASHES.statistics && id && !action && !section)
      return { page: PAGE.STATISTICS, account: id };
    if (page === PAGE_HASHES.cards && !action && !section) {
      const day = workspaceDaySchema.safeParse(id);
      return { page: PAGE.CARDS, day: day.success ? day.data : undefined };
    }
    if (page === PAGE_HASHES.thoughts || page === PAGE_HASHES.watchlist) {
      const target =
        page === PAGE_HASHES.thoughts ? PAGE.THOUGHTS : PAGE.WATCHLIST;
      const date = workspaceDaySchema.safeParse(id);
      return {
        page: target,
        day: date.success && !action && !section ? date.data : undefined,
      };
    }
    if (page === PAGE_HASHES.lectures || page === PAGE_HASHES.notes) {
      const target = page === PAGE_HASHES.lectures ? PAGE.LECTURES : PAGE.NOTES;
      if (id === PAGE_VIEW.NEW && !action)
        return { page: target, view: PAGE_VIEW.NEW };
      if (id && !action) return { page: target, view: PAGE_VIEW.DETAILS, id };
      if (id && action === PAGE_VIEW.EDIT && !section)
        return { page: target, view: PAGE_VIEW.EDIT, id };
      return { page: target, view: PAGE_VIEW.LIST };
    }
    if (page === PAGE_HASHES.reports) {
      const period = PERIODS.find((kind) => kind === id);
      const day = workspaceDaySchema.safeParse(action);
      return period && day.success && !section
        ? {
            page: PAGE.REPORTS,
            period,
            day: periodBounds(period, day.data).start,
          }
        : { page: PAGE.REPORTS };
    }
    if (page === PAGE_HASHES.plans) {
      if (hash === NEW_PLAN_HREF)
        return { page: PAGE.PLANS, view: PAGE_VIEW.NEW };
      if (id && !action)
        return { page: PAGE.PLANS, view: PAGE_VIEW.DETAILS, id };
      if (id && action === PAGE_VIEW.EDIT) {
        if (section === PAGE_VIEW.REVIEW || section === PAGE_VIEW.TRADES) {
          return { page: PAGE.PLANS, view: section, id };
        }
        if (!section) return { page: PAGE.PLANS, view: PAGE_VIEW.EDIT, id };
      }
      return { page: PAGE.PLANS, view: PAGE_VIEW.LIST };
    }
    if (page === PAGE_HASHES.playbooks) {
      if (hash === NEW_PLAYBOOK_HREF)
        return { page: PAGE.PLAYBOOKS, view: PAGE_VIEW.NEW };
      if (id && !action)
        return { page: PAGE.PLAYBOOKS, view: PAGE_VIEW.DETAILS, id };
      if (id && action === PAGE_VIEW.EDIT && !section)
        return { page: PAGE.PLAYBOOKS, view: PAGE_VIEW.EDIT, id };
      return { page: PAGE.PLAYBOOKS, view: PAGE_VIEW.LIST };
    }
    if (page === PAGE_HASHES.backtests) {
      if (hash === NEW_BACKTEST_HREF)
        return { page: PAGE.BACKTESTS, view: PAGE_VIEW.NEW };
      if (id && !action)
        return { page: PAGE.BACKTESTS, view: PAGE_VIEW.DETAILS, id };
      if (id && action === PAGE_VIEW.EDIT && !section)
        return { page: PAGE.BACKTESTS, view: PAGE_VIEW.EDIT, id };
      return { page: PAGE.BACKTESTS, view: PAGE_VIEW.LIST };
    }
    if (
      page === PAGE_HASHES.journal &&
      id &&
      !section &&
      (action === PAGE_VIEW.EDIT || action === PAGE_VIEW.CLOSE)
    )
      return { page: PAGE.JOURNAL, tradeId: id, view: action };
    if (
      page === PAGE_HASHES.journal &&
      id &&
      action === PAGE_VIEW.LINKS &&
      !section
    ) {
      return { page: PAGE.JOURNAL, tradeId: id };
    }
  }
  return { page: PAGE.JOURNAL };
}

export function usePage() {
  return routeFor(useSyncExternalStore(subscribe, currentHash));
}
