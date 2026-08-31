"use client";

import type { Theme } from "@/lib/theme";

const LABELS: Record<Theme, string> = { dark: "Dark", light: "Light", sticker: "Sticker" };
const ICONS: Record<Theme, string> = { dark: "\u25CF", light: "\u25CB", sticker: "\u25A0" };

export default function ThemeToggle({
  theme,
  onCycle,
}: {
  theme: Theme;
  onCycle: () => void;
}) {
  return (
    <button
      onClick={onCycle}
      aria-label={`Theme: ${LABELS[theme]}. Click to switch.`}
      className="card flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[var(--text-dim)] transition-colors hover:text-[var(--text)]"
    >
      <span className="text-[10px]">{ICONS[theme]}</span>
      {LABELS[theme]}
    </button>
  );
}
