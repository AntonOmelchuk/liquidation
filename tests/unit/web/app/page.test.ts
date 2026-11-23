import { expect, test } from "vitest";
import {
  NEW_PLAN_HREF,
  NEW_PLAYBOOK_HREF,
} from "../../../../apps/web/src/app/constants.ts";
import {
  planHref,
  playbookHref,
  routeFor,
  tradeLinksHref,
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
