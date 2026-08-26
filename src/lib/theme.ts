export type Theme = "dark" | "light" | "sticker";

export const THEMES: Theme[] = ["dark", "light", "sticker"];

export const STORAGE_KEY = "cta-theme";

export function readStoredTheme(): Theme | "system" {
  try {
    const t = localStorage.getItem(STORAGE_KEY);
    if (THEMES.includes(t as Theme)) return t as Theme;
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
  return THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
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

const VARS: Record<keyof ChartPalette, string> = {
  chartBg: "--chart-bg",
  grid: "--chart-grid",
  tick: "--chart-tick",
  volume: "--chart-volume",
  tooltipBg: "--chart-tooltip-bg",
  raw: "--series-raw",
  ao5: "--series-ao5",
  ao12: "--series-ao12",
  ao100: "--series-ao100",
  trend: "--series-trend",
  proj: "--series-proj",
};

export function readChartPalette(): ChartPalette {
  const style = getComputedStyle(document.documentElement);
  const out = {} as ChartPalette;
  for (const key of Object.keys(VARS) as (keyof ChartPalette)[]) {
    const v = style.getPropertyValue(VARS[key]).trim();
    out[key] = v || "#71717a";
  }
  return out;
}
