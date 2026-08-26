import type { Solve } from "./types";

export interface PhaseBreakdown {
  crossMs: number;
  f2lMs: number;
  ollMs: number;
  pllMs: number;
}

export const PHASE_KEYS: (keyof PhaseBreakdown)[] = ["crossMs", "f2lMs", "ollMs", "pllMs"];

export const REFERENCE_SHARES: Record<keyof PhaseBreakdown, number> = {
  crossMs: 0.12,
  f2lMs: 0.5,
  ollMs: 0.19,
  pllMs: 0.19,
};

export const PHASE_LABELS: Record<keyof PhaseBreakdown, string> = {
  crossMs: "Cross",
  f2lMs: "F2L",
  ollMs: "OLL",
  pllMs: "PLL",
};

export const MIN_SPLIT_SOLVES = 25;

export function extractPhases(solve: Solve): PhaseBreakdown | null {
  if (solve.dnf || solve.penalty !== 0 || solve.splits.length !== 3) return null;
  const [m3, m2, m1] = solve.splits;
  const final = solve.timeMs;
  if (!(m1 > 0 && m1 < m2 && m2 < m3 && m3 < final)) return null;
  return { crossMs: m1, f2lMs: m2 - m1, ollMs: m3 - m2, pllMs: final - m3 };
}

function median(values: number[]): number {
  if (values.length === 0) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export interface SplitStats {
  usableCount: number;
  /** Median duration share of each phase among usable solves; null shares when insufficient. */
  shares: Record<keyof PhaseBreakdown, number> | null;
  /** Phase furthest above its reference share, with the absolute gap in ms at current level. */
  worst: { phase: keyof PhaseBreakdown; shareGap: number; excessMs: number } | null;
}

export function analyzeSplits(solves: Solve[], currentLevelMs: number): SplitStats {
  const phases = solves.map(extractPhases).filter((p): p is PhaseBreakdown => p !== null);
  if (phases.length < MIN_SPLIT_SOLVES || currentLevelMs <= 0) {
    return { usableCount: phases.length, shares: null, worst: null };
  }
  const shares = {} as Record<keyof PhaseBreakdown, number>;
  let worst: SplitStats["worst"] = null;
  for (const key of PHASE_KEYS) {
    const share = median(
      phases.map((p) => p[key] / (p.crossMs + p.f2lMs + p.ollMs + p.pllMs)),
    );
    shares[key] = share;
    const gap = share - REFERENCE_SHARES[key];
    if (!worst || gap > worst.shareGap) {
      worst = { phase: key, shareGap: gap, excessMs: Math.round(gap * currentLevelMs) };
    }
  }
  return { usableCount: phases.length, shares, worst };
}
