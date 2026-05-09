import type { ThemeMode } from "../types";

export interface ThemeActions {
  initializeTheme: () => void;
  setTheme: (name: string | null) => void;
  setMode: (mode: ThemeMode) => void;
  resetTheme: () => void;
}
