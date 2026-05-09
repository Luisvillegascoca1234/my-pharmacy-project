import { getPresetByName } from "../presets";
import type { ThemeMode, ThemePreferences } from "../types";

export const THEME_STORAGE_KEY = "pharmacy-pos.theme-preferences";

const DEFAULT_THEME_PREFERENCES: ThemePreferences = {
  themeName: null,
  mode: "system"
};

const THEME_MODES = new Set<ThemeMode>(["light", "dark", "system"]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeThemeName(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  return getPresetByName(value) ? value : null;
}

function normalizeThemeMode(value: unknown): ThemeMode {
  return typeof value === "string" && THEME_MODES.has(value as ThemeMode) ? (value as ThemeMode) : "system";
}

export function normalizeThemePreferences(value: unknown): ThemePreferences {
  if (!isObject(value)) {
    return DEFAULT_THEME_PREFERENCES;
  }

  return {
    themeName: normalizeThemeName(value.themeName),
    mode: normalizeThemeMode(value.mode)
  };
}

export function readThemePreferences(): ThemePreferences {
  try {
    const rawValue = window.localStorage.getItem(THEME_STORAGE_KEY);

    if (!rawValue) {
      return DEFAULT_THEME_PREFERENCES;
    }

    return normalizeThemePreferences(JSON.parse(rawValue));
  } catch {
    return DEFAULT_THEME_PREFERENCES;
  }
}

export function writeThemePreferences(preferences: ThemePreferences): void {
  window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(preferences));
}

export function getDefaultThemePreferences(): ThemePreferences {
  return DEFAULT_THEME_PREFERENCES;
}
