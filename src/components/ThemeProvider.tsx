"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Theme } from "@/lib/theme";
import { readStoredTheme, systemTheme, applyTheme, nextTheme } from "@/lib/theme";

interface ThemeContextValue {
  theme: Theme;
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function initTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = readStoredTheme();
  return stored === "system" ? systemTheme() : stored;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const cycleTheme = useCallback(() => {
    setTheme((t) => nextTheme(t));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
