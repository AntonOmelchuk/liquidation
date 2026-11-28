import { useMistakeMessages } from "../features/mistakes/messages.ts";
import { useEffect, useRef } from "react";
import { useGuideMessages } from "../features/guide/messages.ts";
import { useWorkspaceMessages } from "../features/workspace/messages.ts";
import { usePlanningMessages } from "../features/workspace/planning/messages.ts";
import { useTrashMessages } from "../features/trash/messages.ts";
import { useAccountMessages } from "../features/accounts/messages.ts";
import { BackupSettings } from "../features/backup/backup-settings.tsx";
import { DailyQuote } from "../features/inspiration/daily-quote.tsx";
import { QuoteSettings } from "../features/market/quote-settings.tsx";
import { useNewsReactionMessages } from "../features/market/history/messages.ts";
import {
  LANGUAGE,
  TEXT_SIZE,
  TEXT_SIZES,
  THEME,
  THEMES,
} from "../shared/constants.ts";
import { useLocale } from "../shared/messages.ts";
import { SelectField } from "../shared/ui/select-field.tsx";
import { PAGE, PAGE_HASHES } from "./constants.ts";
import type { HeaderProps } from "./types.ts";

import { usePreferences } from "./preferences.ts";

export function Header({ page }: HeaderProps) {
  const { t } = useLocale();
  const m = useWorkspaceMessages();
  const planning = usePlanningMessages();
  const trash = useTrashMessages();
  const accounts = useAccountMessages();
  const guide = useGuideMessages();
  const mistakes = useMistakeMessages();
  const news = useNewsReactionMessages();
  const dialog = useRef<HTMLDialogElement>(null);
  const { language, theme, textSize, update } = usePreferences();
  const navigation = [
    [PAGE.JOURNAL, t.journalNav],
    [PAGE.THOUGHTS, planning.thoughts],
    [PAGE.WATCHLIST, planning.watchlist],
    [PAGE.PLANS, t.plansNav],
    [PAGE.PLAYBOOKS, t.playbooksNav],
    [PAGE.STATISTICS, t.statisticsNav],
    [PAGE.NEWS_REACTIONS, news.nav],
    [PAGE.MISTAKES, mistakes.nav],
    [PAGE.BACKTESTS, t.backtestsNav],
    [PAGE.BEST_TRADES, m.bestTrades],
    [PAGE.CARDS, m.cards],
    [PAGE.REPORTS, m.reportShelf],
    [PAGE.REVIEW, t.reviewNav],
    [PAGE.LECTURES, m.lectures],
    [PAGE.NOTES, m.notesPage],
    [PAGE.ACCOUNTS, accounts.accounts],
    [PAGE.TRASH, trash.trash],
    [PAGE.GUIDE, guide.nav],
  ] as const;

  useEffect(() => {
    const root = document.documentElement;
    root.lang = language;
    root.dataset.theme = theme;
    root.dataset.textSize = textSize;
  }, [language, theme, textSize]);

  return (
    <header className="topbar">
      <a className="brand" href={PAGE_HASHES.journal} aria-label={t.home}>
        <img
          src={import.meta.env.BASE_URL + "liquidation.svg"}
          alt=""
          width={36}
          height={36}
        />
        Liquidation
      </a>
      <nav className="primary-nav" aria-label={t.navigation}>
        {navigation.map(([target, label]) => (
          <a
            key={target}
            href={PAGE_HASHES[target]}
            aria-current={page === target ? "page" : undefined}
          >
            {label}
          </a>
        ))}
      </nav>
      <div className="preferences">
        <button
          className="secondary settings-trigger"
          onClick={() => dialog.current?.showModal()}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          >
            <path d="M4 7h7m4 0h5M4 17h3m4 0h9" />
            <circle cx="13" cy="7" r="2" />
            <circle cx="9" cy="17" r="2" />
          </svg>
          {t.settings}
        </button>
      </div>
      <DailyQuote />
      <dialog ref={dialog} aria-labelledby="settings-title">
        <div className="panel-heading">
          <h2 id="settings-title">{t.settings}</h2>
          <button className="secondary" onClick={() => dialog.current?.close()}>
            {t.close}
          </button>
        </div>
        <div className="settings-fields">
          <SelectField
            label={t.language}
            value={language}
            onChange={(event) =>
              update({
                language:
                  event.target.value === LANGUAGE.UKRAINIAN
                    ? LANGUAGE.UKRAINIAN
                    : LANGUAGE.ENGLISH,
              })
            }
          >
            <option value={LANGUAGE.ENGLISH}>English</option>
            <option value={LANGUAGE.UKRAINIAN}>Українська</option>
          </SelectField>
          <SelectField
            label={t.theme}
            value={theme}
            onChange={(event) =>
              update({
                theme:
                  event.target.value === THEME.LIGHT ? THEME.LIGHT : THEME.DARK,
              })
            }
          >
            {THEMES.map((value) => (
              <option key={value} value={value}>
                {t[value]}
              </option>
            ))}
          </SelectField>
          <SelectField
            label={t.textSize}
            value={textSize}
            onChange={(event) =>
              update({
                textSize:
                  event.target.value === TEXT_SIZE.LARGE
                    ? TEXT_SIZE.LARGE
                    : TEXT_SIZE.NORMAL,
              })
            }
          >
            {TEXT_SIZES.map((value) => (
              <option key={value} value={value}>
                {t[value]}
              </option>
            ))}
          </SelectField>
        </div>
        <QuoteSettings />
        <BackupSettings />
      </dialog>
    </header>
  );
}
