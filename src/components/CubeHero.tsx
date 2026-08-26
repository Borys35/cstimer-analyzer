"use client";

import { useState } from "react";
import type { Theme } from "@/lib/theme";

const COLORS = [
  "#ea3323",
  "#ffd500",
  "#0057c8",
  "#00a651",
  "#ff5800",
  "#f8fafc",
  "#ea3323",
  "#0057c8",
  "#ffd500",
];

export default function CubeHero() {
  const [offset, setOffset] = useState(0);
  const shuffle = () => setOffset((o) => o + 1 + Math.floor(Math.random() * 3));
  return (
    <div
      className="hero-grid mx-auto mb-8 grid w-fit cursor-pointer grid-cols-3 gap-1.5"
      onMouseEnter={shuffle}
      onClick={shuffle}
      aria-hidden
    >
      {COLORS.map((c, i) => {
        const color = COLORS[(i + offset) % COLORS.length];
        return (
          <span
            key={i}
            className="hero-tile block h-9 w-9 sm:h-11 sm:w-11"
            style={{
              background: color,
              "--tilt": `${((i * 37 + offset * 53) % 7) - 3}deg`,
              "--scale": i === (offset % 9) ? 1.08 : 1,
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
}
