export type Theme = "dark" | "light" | "sticker";

export const THEME_ORDER: Theme[] = ["dark", "light", "sticker"];

const STORAGE_KEY = "cta-theme";

export function readStoredTheme(): Theme | "system" {
  try {
    const t = localStorage.getItem(STORAGE_KEY);
    if (t === "dark" || t === "light" || t === "sticker") return t;
  } catch {}
  return "system";
}

export function systemTheme(): Theme {
  try {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {}
}

export function nextTheme(current: Theme): Theme {
  return THEME_ORDER[(THEME_ORDER.indexOf(current) + 1) % THEME_ORDER.length];
}

export interface ChartPalette {
  chartBg: string;
  grid: string;
  tick: string;
  volume: string;
  tooltipBg: string;
  raw: string;
  ao5: string;
  ao12: string;
  ao100: string;
  trend: string;
  proj: string;
}

const DARK_PALETTE: ChartPalette = {
  chartBg: "#18181b",
  grid: "#27272a",
  tick: "#a1a1aa",
  volume: "#3f3f46",
  tooltipBg: "#18181b",
  raw: "#d4d4d8",
  ao5: "#38bdf8",
  ao12: "#818cf8",
  ao100: "#34d399",
  trend: "#fbbf24",
  proj: "#f87171",
};

const LIGHT_PALETTE: ChartPalette = {
  chartBg: "#ffffff",
  grid: "#e4e4e7",
  tick: "#52525b",
  volume: "#d4d4d8",
  tooltipBg: "#ffffff",
  raw: "#71717a",
  ao5: "#0284c7",
  ao12: "#6366f1",
  ao100: "#059669",
  trend: "#d97706",
  proj: "#dc2626",
};

export function paletteFor(theme: Theme): ChartPalette {
  return theme === "light" ? LIGHT_PALETTE : DARK_PALETTE;
}
