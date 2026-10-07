"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Theme } from "@/lib/theme";
import { readStoredTheme, systemTheme, applyTheme, nextTheme } from "@/lib/theme";

interface ThemeContextValue {
  theme: Theme;
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = readStoredTheme();
    const resolved = stored === "system" ? systemTheme() : stored;
    setTheme(resolved);
    applyTheme(resolved);
  }, []);

  useEffect(() => {
    if (mounted) {
      applyTheme(theme);
    }
  }, [theme, mounted]);

  const cycleTheme = useCallback(() => {
    setTheme((t) => nextTheme(t));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
