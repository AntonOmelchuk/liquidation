import "../features/statistics/statistics.css";
import { LEARNING_KIND } from "@liquidation/domain/workspace/constants";
import { lazy, Suspense, useEffect } from "react";
import { BacktestEditorPage } from "../features/backtests/backtest-editor-page.tsx";
import {
  BacktestDetailsPage,
  BacktestsPage,
} from "../features/backtests/backtests-page.tsx";
import { useJournal } from "../features/journal/data/store.ts";
import { JournalPage } from "../features/journal/journal-page.tsx";
import { TRADE_EDITOR_MODE } from "../features/journal/records/constants.ts";
import { PlanDetailsPage } from "../features/plans/details/plan-details-page.tsx";
import { PlanEditorPage } from "../features/plans/editor/plan-editor-page.tsx";
import { PlansPage } from "../features/plans/plans-page.tsx";
import { PlaybooksPage } from "../features/playbooks/playbooks-page.tsx";
import { useLocale } from "../shared/messages.ts";
import { PAGE, PAGE_VIEW } from "./constants.ts";
import { Header } from "./header.tsx";
import { usePage } from "./page.ts";
import type { PageContentProps } from "./types.ts";

const TradeEditorPage = lazy(() =>
  import("../features/journal/records/trade-editor-page.tsx").then(
    (module) => ({ default: module.TradeEditorPage }),
  ),
);
const TradeLinksPage = lazy(() =>
  import("../features/journal/records/trade-links-page.tsx").then((module) => ({
    default: module.TradeLinksPage,
  })),
);
const StatisticsPage = lazy(() =>
  import("../features/statistics/statistics-page.tsx").then((module) => ({
    default: module.StatisticsPage,
  })),
);
const MistakesPage = lazy(
  () => import("../features/mistakes/mistakes-page.tsx"),
);
const NewsReactionsPage = lazy(
  () => import("../features/market/history/news-reactions-page.tsx"),
);
const GuidePage = lazy(() => import("../features/guide/guide-page.tsx"));
const ReviewPage = lazy(() => import("../features/review/review-page.tsx"));
const PlaybookDetailsPage = lazy(
  () => import("../features/playbooks/details/playbook-details-page.tsx"),
);
const PlaybookEditorPage = lazy(
  () => import("../features/playbooks/editor/playbook-editor-page.tsx"),
);
const BestTradesPage = lazy(
  () => import("../features/workspace/highlights/best-trades-page.tsx"),
);
const LearningPage = lazy(
  () => import("../features/workspace/learning/learning-page.tsx"),
);
const ReportsPage = lazy(
  () => import("../features/workspace/reports/reports-page.tsx"),
);

const ThoughtsPage = lazy(
  () => import("../features/workspace/planning/thoughts-page.tsx"),
);
const WatchlistPage = lazy(
  () => import("../features/workspace/planning/watchlist-page.tsx"),
);
const TrashPage = lazy(() => import("../features/trash/trash-page.tsx"));
const AccountsPage = lazy(
  () => import("../features/accounts/accounts-page.tsx"),
);
const CardsPage = lazy(
  () => import("../features/workspace/reports/cards-page.tsx"),
);

function PageContent({ route }: PageContentProps) {
  switch (route.page) {
    case PAGE.PLANS:
      if ("id" in route) {
        return route.view === PAGE_VIEW.DETAILS ? (
          <PlanDetailsPage key={route.id} id={route.id} />
        ) : (
          <PlanEditorPage
            id={route.id}
            section={route.view === PAGE_VIEW.EDIT ? undefined : route.view}
          />
        );
      }
      return route.view === PAGE_VIEW.LIST ? <PlansPage /> : <PlanEditorPage />;
    case PAGE.PLAYBOOKS:
      if ("id" in route) {
        return route.view === PAGE_VIEW.DETAILS ? (
          <PlaybookDetailsPage key={route.id} id={route.id} />
        ) : (
          <PlaybookEditorPage id={route.id} />
        );
      }
      return route.view === PAGE_VIEW.LIST ? (
        <PlaybooksPage />
      ) : (
        <PlaybookEditorPage />
      );
    case PAGE.BACKTESTS:
      if ("id" in route) {
        return route.view === PAGE_VIEW.DETAILS ? (
          <BacktestDetailsPage key={route.id} id={route.id} />
        ) : (
          <BacktestEditorPage id={route.id} />
        );
      }
      return route.view === PAGE_VIEW.LIST ? (
        <BacktestsPage />
      ) : (
        <BacktestEditorPage />
      );
    case PAGE.MISTAKES:
      return <MistakesPage />;
    case PAGE.NEWS_REACTIONS:
      return <NewsReactionsPage />;
    case PAGE.GUIDE:
      return <GuidePage />;
    case PAGE.STATISTICS:
      return <StatisticsPage key={route.account} account={route.account} />;
    case PAGE.ACCOUNTS:
      return <AccountsPage key={route.id} id={route.id} />;
    case PAGE.CARDS:
      return <CardsPage key={route.day} day={route.day} />;
    case PAGE.REPORTS:
      return (
        <ReportsPage
          period={route.period}
          day={route.day}
          recent={route.recent}
        />
      );
    case PAGE.LECTURES:
    case PAGE.NOTES: {
      const id = "id" in route ? route.id : undefined;
      return (
        <LearningPage
          key={route.page + "/" + route.view + "/" + (id ?? "")}
          kind={
            route.page === PAGE.LECTURES
              ? LEARNING_KIND.LESSON
              : LEARNING_KIND.NOTE
          }
          view={route.view}
          id={id}
        />
      );
    }
    case PAGE.BEST_TRADES:
      return <BestTradesPage {...route} />;
    case PAGE.THOUGHTS:
      return (
        <ThoughtsPage
          key={(route.period ?? "") + ":" + (route.day ?? "")}
          day={route.day}
          period={route.period}
        />
      );
    case PAGE.WATCHLIST:
      return <WatchlistPage key={route.day} day={route.day} />;
    case PAGE.TRASH:
      return <TrashPage />;
    case PAGE.REVIEW:
      return <ReviewPage />;
    case PAGE.JOURNAL:
      if (route.view === PAGE_VIEW.NEW)
        return <TradeEditorPage mode={TRADE_EDITOR_MODE.RECORD} />;
      if (route.view === PAGE_VIEW.OPEN)
        return <TradeEditorPage mode={TRADE_EDITOR_MODE.OPEN} />;
      if (route.view === PAGE_VIEW.EDIT || route.view === PAGE_VIEW.CLOSE)
        return <TradeEditorPage mode={route.view} id={route.tradeId} />;
      return route.tradeId ? (
        <TradeLinksPage id={route.tradeId} />
      ) : (
        <JournalPage />
      );
  }
}

export function App() {
  const { t } = useLocale();
  const route = usePage();
  const load = useJournal((state) => state.load);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <Header page={route.page} />
      <Suspense
        fallback={
          <main>
            <p role="status">{t.loading}</p>
          </main>
        }
      >
        <PageContent route={route} />
      </Suspense>
    </>
  );
}
