import type { CSSProperties } from "react";
import { Check, Monitor, Moon, Palette, Sun, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getEffectiveMode, themePresets, useTheme, type ThemeMode } from "@/clients/theme";
import { cn } from "@/lib/utils";

type ModeOption = {
  value: ThemeMode;
  label: string;
  icon: LucideIcon;
};

const MODE_OPTIONS: ModeOption[] = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor }
];

const SWATCH_KEYS = ["primary", "secondary", "accent", "destructive", "muted"] as const;

const DEFAULT_THEME_SWATCH_COLORS = {
  light: {
    primary: "oklch(0.47 0.082 183)",
    secondary: "oklch(0.96 0.035 57)",
    accent: "oklch(0.944 0.024 183)",
    destructive: "oklch(0.577 0.215 27)",
    muted: "oklch(0.957 0.009 220)"
  },
  dark: {
    primary: "oklch(0.72 0.11 181)",
    secondary: "oklch(0.3 0.065 50)",
    accent: "oklch(0.285 0.045 183)",
    destructive: "oklch(0.66 0.19 27)",
    muted: "oklch(0.255 0.018 225)"
  }
} satisfies Record<"light" | "dark", Record<(typeof SWATCH_KEYS)[number], string>>;

function ThemeSwatches({ colors }: { colors: Record<string, string> }) {
  return (
    <span className="ml-auto flex shrink-0 gap-1">
      {SWATCH_KEYS.map((key) => (
        <span
          aria-hidden="true"
          className="size-3 rounded-full border border-border"
          key={key}
          style={{ backgroundColor: colors[key] } as CSSProperties}
        />
      ))}
    </span>
  );
}

export function ThemeSelector() {
  const { themeName, mode, setMode, setTheme } = useTheme();
  const effectiveMode = getEffectiveMode(mode);

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button aria-label="Cambiar tema" size="icon" variant="outline">
              <Palette aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Cambiar tema</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="max-h-[32rem] w-80">
        <DropdownMenuLabel>Modo</DropdownMenuLabel>
        <div className="grid grid-cols-3 gap-1 px-1 pb-1">
          {MODE_OPTIONS.map(({ value, label, icon: Icon }) => {
            const isActive = mode === value;

            return (
              <button
                aria-pressed={isActive}
                className={cn(
                  "inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 text-xs font-medium text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-1 focus-visible:ring-ring",
                  isActive && "border-border bg-accent text-accent-foreground"
                )}
                key={value}
                onClick={() => setMode(value)}
                type="button"
              >
                <Icon aria-hidden="true" className="size-3.5" />
                {label}
              </button>
            );
          })}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Paletas</DropdownMenuLabel>
        <DropdownMenuItem
          className="gap-2 py-2"
          onSelect={(event) => {
            event.preventDefault();
            setTheme(null);
          }}
        >
          <Check className={cn("size-4 opacity-0", themeName === null && "opacity-100")} />
          <span>Base Clinical</span>
          <ThemeSwatches colors={DEFAULT_THEME_SWATCH_COLORS[effectiveMode]} />
        </DropdownMenuItem>
        {themePresets.map((preset) => {
          const isActive = themeName === preset.name;

          return (
            <DropdownMenuItem
              className="gap-2 py-2"
              key={preset.name}
              onSelect={(event) => {
                event.preventDefault();
                setTheme(preset.name);
              }}
            >
              <Check className={cn("size-4 opacity-0", isActive && "opacity-100")} />
              <span className="truncate">{preset.label}</span>
              <ThemeSwatches colors={preset.cssVars[effectiveMode]} />
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
