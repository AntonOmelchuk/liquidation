import { useSyncExternalStore } from "react";
import {
  NEW_BACKTEST_HREF,
  NEW_PLAN_HREF,
  NEW_PLAYBOOK_HREF,
  PAGE,
  PAGE_HASHES,
  PAGE_VIEW,
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

export function tradeLinksHref(id: string) {
  return `${PAGE_HASHES.journal}/${id}/${PAGE_VIEW.LINKS}`;
}

export function routeFor(hash: string): Route {
  if (hash === PAGE_HASHES.statistics) return { page: PAGE.STATISTICS };
  const [page, id, action, section, ...rest] = hash.split("/");
  if (rest.length === 0) {
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
