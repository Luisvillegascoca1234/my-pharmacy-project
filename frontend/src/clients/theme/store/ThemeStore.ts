import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { ThemeActions } from "./ThemeActions";
import { initialThemeState, type ThemeState } from "./ThemeState";
import { applyThemeByName } from "../utils/applyTheme";
import { getDefaultThemePreferences, readThemePreferences, writeThemePreferences } from "../utils/themeStorage";

export type ThemeStore = ThemeState & ThemeActions;

export const useThemeStore = create<ThemeStore>()(
  devtools(
    (set, get) => ({
      ...initialThemeState,

      initializeTheme() {
        const preferences = readThemePreferences();

        applyThemeByName(preferences.themeName, preferences.mode);
        set({ ...preferences, isInitialized: true }, false, "initializeTheme");
      },

      setTheme(name) {
        const mode = get().mode;

        applyThemeByName(name, mode);
        writeThemePreferences({ themeName: name, mode });
        set({ themeName: name }, false, "setTheme");
      },

      setMode(mode) {
        const themeName = get().themeName;

        applyThemeByName(themeName, mode);
        writeThemePreferences({ themeName, mode });
        set({ mode }, false, "setMode");
      },

      resetTheme() {
        const preferences = getDefaultThemePreferences();

        applyThemeByName(preferences.themeName, preferences.mode);
        writeThemePreferences(preferences);
        set({ ...preferences, isInitialized: true }, false, "resetTheme");
      }
    }),
    { name: "ThemeStore" }
  )
);
