export type ThemeMode = "light" | "dark" | "system";

export type EffectiveThemeMode = Exclude<ThemeMode, "system">;

export interface ThemePreset {
  name: string;
  label: string;
  cssVars: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
}

export interface ThemePreferences {
  themeName: string | null;
  mode: ThemeMode;
}
