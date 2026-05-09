import type { ThemePreset } from "../types";

import theme2077 from "./2077.json";
import astrovista from "./astrovista.json";
import catppuccin from "./catppuccin.json";
import claude from "./claude.json";
import claymorphism from "./claymorphism.json";
import cyberpunk from "./cyberpunk.json";
import darkForge from "./dark-forge.json";
import deepPurple from "./deep-purple.json";
import doom64 from "./doom-64.json";
import elegantLuxury from "./elegant-luxury.json";
import hackerTerminal from "./hacker-terminal.json";
import lightGreen from "./light-green.json";
import minimalNeutral from "./minimal-neutral.json";
import modernMinimal from "./modern-minimal.json";
import mxBrutalist from "./mx-brutalist.json";
import neoBrutalism from "./neo-brutalism.json";
import nlan from "./nlan.json";
import northernLights from "./northern-lights.json";
import offworld from "./offworld.json";
import portfolio from "./portfolio.json";
import retroArcade from "./retro-arcade.json";
import sageGreen from "./sage-green.json";
import zen from "./zen.json";

export const themePresets: ThemePreset[] = [
  astrovista,
  catppuccin,
  claude,
  claymorphism,
  cyberpunk,
  darkForge,
  deepPurple,
  doom64,
  elegantLuxury,
  hackerTerminal,
  lightGreen,
  minimalNeutral,
  modernMinimal,
  mxBrutalist,
  neoBrutalism,
  nlan,
  northernLights,
  offworld,
  portfolio,
  retroArcade,
  sageGreen,
  theme2077,
  zen
];

export function getPresetByName(name: string): ThemePreset | undefined {
  return themePresets.find((preset) => preset.name === name);
}
