import type { Theme } from "@/lib/theme";

const LABELS: Record<Theme, string> = { dark: "Dark", light: "Light", sticker: "Sticker" };
const DOTS: Record<Theme, string[]> = {
  dark: ["#18181b", "#3f3f46", "#a1a1aa"],
  light: ["#ffffff", "#d4d4d8", "#52525b"],
  sticker: ["#ea3323", "#ffd500", "#0057c8"],
};

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
      className="card flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium transition-colors hover:border-[var(--cube-yellow)]"
    >
      <span className="flex -space-x-1">
        {DOTS[theme].map((c, i) => (
          <span
            key={i}
            className="inline-block h-3.5 w-3.5 rounded-full border border-black/30"
            style={{ background: c }}
          />
        ))}
      </span>
      {LABELS[theme]}
    </button>
  );
}
