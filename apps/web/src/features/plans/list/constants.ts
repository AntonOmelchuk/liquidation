import { FILTER_ALL } from "../../../shared/constants.ts";

export const PLAN_SORT = {
  LATEST: "latest",
  EARLIEST: "earliest",
  SYMBOL: "symbol",
  STATUS: "status",
} as const;
export const PLAN_SORTS = Object.values(PLAN_SORT);
export const DEFAULT_PLAN_FILTERS = {
  query: "",
  status: FILTER_ALL,
  sort: PLAN_SORT.LATEST,
} as const;
