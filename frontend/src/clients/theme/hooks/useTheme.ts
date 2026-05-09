import { useShallow } from "zustand/react/shallow";
import { selectIsThemeInitialized, selectThemeActions, selectThemeMode, selectThemeName } from "../store/ThemeSelectors";
import { useThemeStore } from "../store/ThemeStore";

export function useTheme() {
  const themeName = useThemeStore(selectThemeName);
  const mode = useThemeStore(selectThemeMode);
  const isInitialized = useThemeStore(selectIsThemeInitialized);
  const actions = useThemeStore(useShallow(selectThemeActions));

  return {
    themeName,
    mode,
    isInitialized,
    ...actions
  };
}
