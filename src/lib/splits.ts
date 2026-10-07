import type { Solve } from "./types";

export interface PhaseConfig {
  labels?: string[];
  referenceShares?: number[];
}

export const DEFAULT_CFOP_CONFIG: PhaseConfig = {
  labels: ["Cross", "F2L", "OLL", "PLL"],
  referenceShares: [0.12, 0.5, 0.19, 0.19],
};

export const DEFAULT_ROUX_CONFIG: PhaseConfig = {
  labels: ["First Block", "Second Block", "CMLL", "LSE"],
  referenceShares: [0.18, 0.4, 0.18, 0.24],
};

export const MIN_SPLIT_SOLVES = 25;

export interface PhaseBreakdown {
  phases: { label: string; ms: number }[];
}

/**
 * Extracts individual phase durations from cumulative splits in solve.
 * Splits in csTimer: [m_k, m_{k-1}, ..., m_1] in reverse order before final time.
 */
export function extractPhases(solve: Solve, labels?: string[]): PhaseBreakdown | null {
  if (solve.dnf || solve.penalty !== 0 || !solve.splits || solve.splits.length === 0) return null;
  const reversed = [...solve.splits].reverse();
  const milestones = [...reversed, solve.timeMs];
  for (let i = 0; i < milestones.length - 1; i++) {
    if (milestones[i] <= 0 || milestones[i] >= milestones[i + 1]) return null;
  }
  const durations: number[] = [milestones[0]];
  for (let i = 1; i < milestones.length; i++) {
    durations.push(milestones[i] - milestones[i - 1]);
  }
  const count = durations.length;
  const phaseLabels =
    labels && labels.length === count
      ? labels
      : count === 4
      ? DEFAULT_CFOP_CONFIG.labels!
      : Array.from({ length: count }, (_, i) => `Phase ${i + 1}`);

  return {
    phases: durations.map((ms, i) => ({
      label: phaseLabels[i] || `Phase ${i + 1}`,
      ms,
    })),
  };
}

function median(values: number[]): number {
  if (values.length === 0) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export interface PhaseStat {
  phaseIndex: number;
  label: string;
  share: number;
  referenceShare: number;
  shareGap: number;
  excessMs: number;
}

export interface SplitStats {
  usableCount: number;
  phaseCount: number;
  labels: string[];
  shares: Record<string, number> | null;
  worst: PhaseStat | null;
}

export function analyzeSplits(
  solves: Solve[],
  currentLevelMs: number,
  config?: PhaseConfig,
): SplitStats {
  const parsed = solves
    .map((s) => extractPhases(s, config?.labels))
    .filter((p): p is PhaseBreakdown => p !== null);

  if (parsed.length === 0) {
    return {
      usableCount: 0,
      phaseCount: 0,
      labels: [],
      shares: null,
      worst: null,
    };
  }

  // Group by phase count (take the dominant phase count if mixed)
  const countMap = new Map<number, PhaseBreakdown[]>();
  for (const p of parsed) {
    const k = p.phases.length;
    const arr = countMap.get(k) ?? [];
    arr.push(p);
    countMap.set(k, arr);
  }
  let dominantCount = 0;
  let dominantList: PhaseBreakdown[] = [];
  for (const [k, list] of countMap.entries()) {
    if (list.length > dominantList.length) {
      dominantCount = k;
      dominantList = list;
    }
  }

  const phaseLabels = dominantList[0].phases.map((p) => p.label);
  const referenceShares =
    config?.referenceShares && config.referenceShares.length === dominantCount
      ? config.referenceShares
      : dominantCount === 4 && (!config?.labels || config.labels[0] === "Cross")
      ? DEFAULT_CFOP_CONFIG.referenceShares!
      : Array.from({ length: dominantCount }, () => 1 / dominantCount);

  if (dominantList.length < MIN_SPLIT_SOLVES || currentLevelMs <= 0) {
    return {
      usableCount: dominantList.length,
      phaseCount: dominantCount,
      labels: phaseLabels,
      shares: null,
      worst: null,
    };
  }

  const shares: Record<string, number> = {};
  let worst: PhaseStat | null = null;

  for (let i = 0; i < dominantCount; i++) {
    const label = phaseLabels[i];
    const refShare = referenceShares[i];
    const phaseShares = dominantList.map((p) => {
      const total = p.phases.reduce((acc, ph) => acc + ph.ms, 0);
      return total > 0 ? p.phases[i].ms / total : 0;
    });
    const share = median(phaseShares);
    shares[label] = share;
    const gap = share - refShare;
    if (!worst || gap > worst.shareGap) {
      worst = {
        phaseIndex: i,
        label,
        share,
        referenceShare: refShare,
        shareGap: gap,
        excessMs: Math.round(gap * currentLevelMs),
      };
    }
  }

  return {
    usableCount: dominantList.length,
    phaseCount: dominantCount,
    labels: phaseLabels,
    shares,
    worst,
  };
}
