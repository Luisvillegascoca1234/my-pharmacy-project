import { getPresetByName } from "../presets";
import type { EffectiveThemeMode, ThemeMode, ThemePreferences } from "../types";
import { readThemePreferences } from "./themeStorage";

const SYSTEM_FONTS = new Set([
  "ui-sans-serif",
  "ui-serif",
  "ui-monospace",
  "system-ui",
  "sans-serif",
  "serif",
  "monospace",
  "cursive",
  "fantasy",
  "sfmono-regular",
  "menlo",
  "monaco",
  "consolas",
  "liberation mono",
  "courier new",
  "courier",
  "times new roman",
  "times",
  "georgia",
  "cambria",
  "apple color emoji",
  "segoe ui emoji",
  "segoe ui symbol",
  "noto color emoji",
  "-apple-system"
]);

const FONT_LINK_ID = "theme-google-fonts";

const THEME_VARS = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "destructive-foreground",
  "border",
  "input",
  "ring",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "sidebar",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
  "radius",
  "font-sans",
  "font-mono",
  "font-serif",
  "shadow-2xs",
  "shadow-xs",
  "shadow-sm",
  "shadow",
  "shadow-md",
  "shadow-lg",
  "shadow-xl",
  "shadow-2xl",
  "tracking-normal"
] as const;

function parseFontFamilies(value: string): string[] {
  return value
    .split(",")
    .map((font) => font.trim().replace(/^["']|["']$/g, ""))
    .filter((font) => font && !SYSTEM_FONTS.has(font.toLowerCase()));
}

function loadGoogleFonts(vars: Record<string, string>): void {
  const families = new Set<string>();

  for (const key of ["font-sans", "font-mono", "font-serif"]) {
    const fontValue = vars[key];

    if (!fontValue) {
      continue;
    }

    for (const family of parseFontFamilies(fontValue)) {
      families.add(family);
    }
  }

  document.getElementById(FONT_LINK_ID)?.remove();

  if (families.size === 0) {
    return;
  }

  const params = [...families]
    .map((family) => `family=${family.replace(/ /g, "+")}:wght@300;400;500;600;700`)
    .join("&");
  const link = document.createElement("link");

  link.id = FONT_LINK_ID;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?${params}&display=swap`;
  document.head.appendChild(link);
}

export function applyThemeColors(vars: Record<string, string> | null): void {
  const root = document.documentElement;

  if (!vars) {
    for (const key of THEME_VARS) {
      root.style.removeProperty(`--${key}`);
    }
    document.getElementById(FONT_LINK_ID)?.remove();
    return;
  }

  loadGoogleFonts(vars);

  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(`--${key}`, value);
  }
}

export function applyDarkMode(isDark: boolean): void {
  document.documentElement.classList.toggle("dark", isDark);
}

export function getEffectiveMode(mode: ThemeMode): EffectiveThemeMode {
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  return mode;
}

export function applyThemeByName(themeName: string | null, mode: ThemeMode): void {
  const effectiveMode = getEffectiveMode(mode);

  applyDarkMode(effectiveMode === "dark");

  if (!themeName) {
    applyThemeColors(null);
    return;
  }

  const preset = getPresetByName(themeName);
  applyThemeColors(preset ? preset.cssVars[effectiveMode] : null);
}

export function bootstrapTheme(): ThemePreferences {
  const preferences = readThemePreferences();

  applyThemeByName(preferences.themeName, preferences.mode);
  return preferences;
}
