import { useEffect } from "react";
import { BacktestEditorPage } from "../features/backtests/backtest-editor-page.tsx";
import {
  BacktestDetailsPage,
  BacktestsPage,
} from "../features/backtests/backtests-page.tsx";
import { useJournal } from "../features/journal/data/store.ts";
import { JournalPage } from "../features/journal/journal-page.tsx";
import { TradeLinksPage } from "../features/journal/records/trade-links-page.tsx";
import { PlanDetailsPage } from "../features/plans/details/plan-details-page.tsx";
import { PlanEditorPage } from "../features/plans/editor/plan-editor-page.tsx";
import { PlansPage } from "../features/plans/plans-page.tsx";
import { PlaybookDetailsPage } from "../features/playbooks/details/playbook-details-page.tsx";
import { PlaybookEditorPage } from "../features/playbooks/editor/playbook-editor-page.tsx";
import { PlaybooksPage } from "../features/playbooks/playbooks-page.tsx";
import { StatisticsPage } from "../features/statistics/statistics-page.tsx";
import { PAGE, PAGE_VIEW } from "./constants.ts";
import { Header } from "./header.tsx";
import { usePage } from "./page.ts";
import type { PageContentProps } from "./types.ts";

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
    case PAGE.STATISTICS:
      return <StatisticsPage />;
    case PAGE.JOURNAL:
      return route.tradeId ? (
        <TradeLinksPage id={route.tradeId} />
      ) : (
        <JournalPage />
      );
  }
}

export function App() {
  const route = usePage();
  const load = useJournal((state) => state.load);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <Header page={route.page} />
      <PageContent route={route} />
    </>
  );
}
