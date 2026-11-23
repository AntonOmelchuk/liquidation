import { create } from "zustand";
import { persist } from "zustand/middleware";
import { LANGUAGE, TEXT_SIZE, THEME } from "../shared/constants.ts";
import { PREFERENCES_KEY } from "./constants.ts";
import type { Preferences } from "./types.ts";

export const usePreferences = create<
  Preferences & {
    update: (preferences: Partial<Preferences>) => void;
  }
>()(
  persist(
    (set) => ({
      language: LANGUAGE.ENGLISH,
      theme: THEME.DARK,
      textSize: TEXT_SIZE.NORMAL,
      update: (preferences) => set(preferences),
    }),
    { name: PREFERENCES_KEY },
  ),
);
