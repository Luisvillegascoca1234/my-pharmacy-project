import type { ThemeActions } from "./ThemeActions";
import type { ThemeState } from "./ThemeState";

type State = ThemeState & ThemeActions;

export const selectThemeName = (state: State) => state.themeName;
export const selectThemeMode = (state: State) => state.mode;
export const selectIsThemeInitialized = (state: State) => state.isInitialized;

export const selectThemeActions = (state: State) => ({
  initializeTheme: state.initializeTheme,
  setTheme: state.setTheme,
  setMode: state.setMode,
  resetTheme: state.resetTheme
});
