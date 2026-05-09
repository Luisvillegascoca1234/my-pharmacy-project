import type { ThemeMode } from "../types";
import { readThemePreferences } from "../utils/themeStorage";

const initialPreferences = readThemePreferences();

export interface ThemeState {
  themeName: string | null;
  mode: ThemeMode;
  isInitialized: boolean;
}

export const initialThemeState: ThemeState = {
  themeName: initialPreferences.themeName,
  mode: initialPreferences.mode,
  isInitialized: false
};
