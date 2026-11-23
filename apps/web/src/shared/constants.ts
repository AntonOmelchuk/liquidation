export const LANGUAGE = { ENGLISH: "en", UKRAINIAN: "uk" } as const;
export const LOCALES = {
  [LANGUAGE.ENGLISH]: "en-US",
  [LANGUAGE.UKRAINIAN]: "uk-UA",
} as const;
export const THEME = { DARK: "dark", LIGHT: "light" } as const;
export const THEMES = Object.values(THEME);
export const TEXT_SIZE = { NORMAL: "normal", LARGE: "large" } as const;
export const TEXT_SIZES = Object.values(TEXT_SIZE);
export const EMPTY_VALUE = "—";
export const FILTER_ALL = "all";

export const NEW_DRAFT = "new";
