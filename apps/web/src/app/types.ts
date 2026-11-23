import type { LOCALES, TEXT_SIZES, THEMES } from "../shared/constants.ts";
import type { PAGE, PAGE_HASHES, PAGE_VIEW } from "./constants.ts";
import type { usePage } from "./page.ts";

export type HeaderProps = { page: Page };

export type PageContentProps = { route: ReturnType<typeof usePage> };

export type Page = keyof typeof PAGE_HASHES;

export type Route =
  | { page: typeof PAGE.STATISTICS }
  | {
      page: typeof PAGE.BACKTESTS;
      view: typeof PAGE_VIEW.LIST | typeof PAGE_VIEW.NEW;
    }
  | {
      page: typeof PAGE.BACKTESTS;
      view: typeof PAGE_VIEW.DETAILS | typeof PAGE_VIEW.EDIT;
      id: string;
    }
  | { page: typeof PAGE.JOURNAL; tradeId?: string }
  | {
      page: typeof PAGE.PLANS;
      view: typeof PAGE_VIEW.LIST | typeof PAGE_VIEW.NEW;
    }
  | {
      page: typeof PAGE.PLANS;
      view:
        | typeof PAGE_VIEW.DETAILS
        | typeof PAGE_VIEW.EDIT
        | typeof PAGE_VIEW.REVIEW
        | typeof PAGE_VIEW.TRADES;
      id: string;
    }
  | {
      page: typeof PAGE.PLAYBOOKS;
      view: typeof PAGE_VIEW.LIST | typeof PAGE_VIEW.NEW;
    }
  | {
      page: typeof PAGE.PLAYBOOKS;
      view: typeof PAGE_VIEW.DETAILS | typeof PAGE_VIEW.EDIT;
      id: string;
    };

export type Preferences = {
  language: keyof typeof LOCALES;
  theme: (typeof THEMES)[number];
  textSize: (typeof TEXT_SIZES)[number];
};
