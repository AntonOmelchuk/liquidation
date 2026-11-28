import type { LOCALES, TEXT_SIZES, THEMES } from "../shared/constants.ts";
import type {
  PreparationPeriod,
  ReviewPeriod,
} from "@liquidation/domain/workspace/types";
import type { PAGE, PAGE_HASHES, PAGE_VIEW } from "./constants.ts";
import type { usePage } from "./page.ts";

export type HeaderProps = { page: Page };

export type PageContentProps = { route: ReturnType<typeof usePage> };

export type Page = keyof typeof PAGE_HASHES;

export type Route =
  | { page: typeof PAGE.STATISTICS; account?: string }
  | {
      page:
        | typeof PAGE.REVIEW
        | typeof PAGE.GUIDE
        | typeof PAGE.MISTAKES
        | typeof PAGE.NEWS_REACTIONS;
    }
  | {
      page: typeof PAGE.REPORTS;
      recent?: boolean;
      period?: ReviewPeriod;
      day?: string;
    }
  | {
      page: typeof PAGE.LECTURES | typeof PAGE.NOTES;
      view: typeof PAGE_VIEW.LIST | typeof PAGE_VIEW.NEW;
    }
  | {
      page: typeof PAGE.LECTURES | typeof PAGE.NOTES;
      view: typeof PAGE_VIEW.DETAILS | typeof PAGE_VIEW.EDIT;
      id: string;
    }
  | {
      page: typeof PAGE.BEST_TRADES;
      view: typeof PAGE_VIEW.LIST | typeof PAGE_VIEW.NEW;
    }
  | {
      page: typeof PAGE.BEST_TRADES;
      view: typeof PAGE_VIEW.DETAILS | typeof PAGE_VIEW.EDIT;
      id: string;
    }
  | {
      page: typeof PAGE.MISSED_TRADES;
      view: typeof PAGE_VIEW.LIST | typeof PAGE_VIEW.NEW;
      day?: string;
    }
  | {
      page: typeof PAGE.MISSED_TRADES;
      view: typeof PAGE_VIEW.DETAILS | typeof PAGE_VIEW.EDIT;
      id: string;
    }
  | {
      page: typeof PAGE.BACKTESTS;
      view: typeof PAGE_VIEW.SAMPLES;
      id: string;
      sampleId?: string;
      editing: boolean;
    }
  | { page: typeof PAGE.TRASH }
  | { page: typeof PAGE.ACCOUNTS; id?: string }
  | { page: typeof PAGE.CARDS; day?: string }
  | { page: typeof PAGE.THOUGHTS; day?: string; period?: PreparationPeriod }
  | { page: typeof PAGE.WATCHLIST; day?: string; view?: typeof PAGE_VIEW.NEW }
  | {
      page: typeof PAGE.BACKTESTS;
      view: typeof PAGE_VIEW.LIST | typeof PAGE_VIEW.NEW;
    }
  | {
      page: typeof PAGE.BACKTESTS;
      view: typeof PAGE_VIEW.DETAILS | typeof PAGE_VIEW.EDIT;
      id: string;
    }
  | { page: typeof PAGE.JOURNAL; tradeId?: string; view?: undefined }
  | {
      page: typeof PAGE.JOURNAL;
      view: typeof PAGE_VIEW.NEW | typeof PAGE_VIEW.OPEN;
      tradeId?: undefined;
    }
  | {
      page: typeof PAGE.JOURNAL;
      view: typeof PAGE_VIEW.EDIT | typeof PAGE_VIEW.CLOSE;
      tradeId: string;
    }
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
  quoteSymbols: string[];
  quoteMotion: boolean;
  language: keyof typeof LOCALES;
  theme: (typeof THEMES)[number];
  textSize: (typeof TEXT_SIZES)[number];
};
