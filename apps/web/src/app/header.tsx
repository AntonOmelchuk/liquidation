import { useEffect, useRef } from "react";
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
  const dialog = useRef<HTMLDialogElement>(null);
  const { language, theme, textSize, update } = usePreferences();

  useEffect(() => {
    const root = document.documentElement;
    root.lang = language;
    root.dataset.theme = theme;
    root.dataset.textSize = textSize;
  }, [language, theme, textSize]);

  return (
    <header className="topbar">
      <a className="brand" href={PAGE_HASHES.journal} aria-label={t.home}>
        <span aria-hidden="true">◈</span> Liquidation
      </a>
      <nav className="primary-nav" aria-label={t.navigation}>
        <a
          href={PAGE_HASHES.journal}
          aria-current={page === PAGE.JOURNAL ? "page" : undefined}
        >
          {t.journalNav}
        </a>
        <a
          href={PAGE_HASHES.plans}
          aria-current={page === PAGE.PLANS ? "page" : undefined}
        >
          {t.plansNav}
        </a>
        <a
          href={PAGE_HASHES.playbooks}
          aria-current={page === PAGE.PLAYBOOKS ? "page" : undefined}
        >
          {t.playbooksNav}
        </a>
        <a
          href={PAGE_HASHES.statistics}
          aria-current={page === PAGE.STATISTICS ? "page" : undefined}
        >
          {t.statisticsNav}
        </a>
        <a
          href={PAGE_HASHES.backtests}
          aria-current={page === PAGE.BACKTESTS ? "page" : undefined}
        >
          {t.backtestsNav}
        </a>
      </nav>
      <div className="preferences">
        <span className="local">
          <i aria-hidden="true" />
          {t.local}
        </span>
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
      </dialog>
    </header>
  );
}
