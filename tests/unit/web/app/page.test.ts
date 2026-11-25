import { LEARNING_KIND } from "@liquidation/domain/workspace/constants";
import { expect, test } from "vitest";
import {
  NEW_PLAN_HREF,
  NEW_PLAYBOOK_HREF,
} from "../../../../apps/web/src/app/constants.ts";
import {
  learningHref,
  planHref,
  playbookHref,
  routeFor,
  thoughtHref,
  tradeLinksHref,
  watchlistHref,
} from "../../../../apps/web/src/app/page.ts";

test("addresses plan creation, editing and review as independent page routes", () => {
  const id = "0a047d28-0555-4dfb-b1fb-acfea3c1e577";
  expect(routeFor(NEW_PLAN_HREF)).toEqual({ page: "plans", view: "new" });
  expect(routeFor(planHref(id))).toEqual({
    page: "plans",
    view: "details",
    id,
  });
  expect(routeFor(planHref(id, "edit"))).toEqual({
    page: "plans",
    view: "edit",
    id,
  });
  expect(routeFor(planHref(id, "review"))).toEqual({
    page: "plans",
    view: "review",
    id,
  });
  expect(routeFor(planHref(id, "trades"))).toEqual({
    page: "plans",
    view: "trades",
    id,
  });
  expect(routeFor(NEW_PLAYBOOK_HREF)).toEqual({
    page: "playbooks",
    view: "new",
  });
  expect(routeFor(playbookHref(id, true))).toEqual({
    page: "playbooks",
    view: "edit",
    id,
  });
  expect(routeFor(tradeLinksHref(id))).toEqual({
    page: "journal",
    tradeId: id,
  });
});

test("opens the AI trade review at its own route", () => {
  expect(routeFor("#review")).toEqual({ page: "review" });
});

test("addresses thoughts by local day and watchlists by week", () => {
  expect(routeFor(thoughtHref("2026-11-24"))).toEqual({
    page: "thoughts",
    day: "2026-11-24",
  });
  expect(routeFor(watchlistHref("2026-11-24"))).toEqual({
    page: "watchlist",
    day: "2026-11-23",
  });
  expect(routeFor("#thoughts/2026-02-30")).toEqual({
    page: "thoughts",
    day: undefined,
  });
  expect(routeFor("#trash")).toEqual({ page: "trash" });
});

test("gives lectures and notes their own list, editor and detail routes", () => {
  const id = "0a047d28-0555-4dfb-b1fb-acfea3c1e577";
  expect(routeFor("#learning")).toEqual({ page: "lectures", view: "list" });
  expect(routeFor("#lectures/new")).toEqual({ page: "lectures", view: "new" });
  expect(routeFor(learningHref(LEARNING_KIND.LESSON, id))).toEqual({
    page: "lectures",
    view: "details",
    id,
  });
  expect(routeFor(learningHref(LEARNING_KIND.NOTE, id, true))).toEqual({
    page: "notes",
    view: "edit",
    id,
  });
  expect(routeFor("#notes")).toEqual({ page: "notes", view: "list" });
});

test("opens accounts and the quarter card calendar by route", () => {
  const id = "0a047d28-0555-4dfb-b1fb-acfea3c1e577";
  expect(routeFor("#accounts")).toMatchObject({ page: "accounts" });
  expect(routeFor("#accounts/" + id)).toEqual({ page: "accounts", id });
  expect(routeFor("#statistics/" + id)).toEqual({
    page: "statistics",
    account: id,
  });
  expect(routeFor("#cards/2026-10-01")).toEqual({
    page: "cards",
    day: "2026-10-01",
  });
  expect(routeFor("#reports")).toEqual({ page: "reports" });
});

test("opens the journal guide independently of journal records", () => {
  expect(routeFor("#guide")).toEqual({ page: "guide" });
});

test("opens trade recording, opening, editing and closing as full pages and exposes mistake analytics", () => {
  const id = "0a047d28-0555-4dfb-b1fb-acfea3c1e577";
  expect(routeFor("#journal/new")).toEqual({ page: "journal", view: "new" });
  expect(routeFor("#journal/open")).toEqual({ page: "journal", view: "open" });
  expect(routeFor("#journal/" + id + "/edit")).toEqual({
    page: "journal",
    view: "edit",
    tradeId: id,
  });
  expect(routeFor("#journal/" + id + "/close")).toEqual({
    page: "journal",
    view: "close",
    tradeId: id,
  });
  expect(routeFor("#mistakes")).toEqual({ page: "mistakes" });
});
