import type { ParsedSession, Solve } from "./types";
import { median, madCv } from "./stats";

export interface HistogramBin {
  binStartMs: number;
  binEndMs: number;
  label: string;
  count: number;
  normalCount: number;
}

export interface HistogramResult {
  bins: HistogramBin[];
  binWidthMs: number;
  meanMs: number;
  medianMs: number;
  stdDevMs: number;
  minMs: number;
  maxMs: number;
}

export function computeHistogram(times: number[], targetBinCount = 15): HistogramResult | null {
  if (times.length < 3) return null;
  const sorted = [...times].sort((a, b) => a - b);
  const minMs = sorted[0];
  const maxMs = sorted[sorted.length - 1];
  const meanMs = sorted.reduce((a, b) => a + b, 0) / sorted.length;
  const medianMs = median(sorted)!;
  const variance = sorted.reduce((a, b) => a + (b - meanMs) ** 2, 0) / sorted.length;
  const stdDevMs = Math.sqrt(variance);

  const range = Math.max(maxMs - minMs, 1000);
  const rawWidth = range / targetBinCount;
  const candidateSteps = [100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 15000, 30000];
  let binWidthMs = candidateSteps[0];
  for (const s of candidateSteps) {
    if (s >= rawWidth) {
      binWidthMs = s;
      break;
    }
    binWidthMs = s;
  }
  if (binWidthMs < rawWidth) {
    binWidthMs = Math.ceil(rawWidth / 1000) * 1000;
  }

  const startMs = Math.floor(minMs / binWidthMs) * binWidthMs;
  const endMs = Math.ceil(maxMs / binWidthMs) * binWidthMs + (maxMs % binWidthMs === 0 ? binWidthMs : 0);

  const bins: HistogramBin[] = [];
  const fmtSec = (ms: number) => (ms / 1000).toFixed(ms % 1000 === 0 ? 0 : 1) + "s";

  const totalN = sorted.length;
  const normalPdf = (x: number) => {
    if (stdDevMs === 0) return 0;
    return (1 / (stdDevMs * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((x - meanMs) / stdDevMs) ** 2);
  };

  for (let b = startMs; b < endMs; b += binWidthMs) {
    const nextB = b + binWidthMs;
    const count = sorted.filter((t) => t >= b && (nextB >= endMs ? t <= nextB : t < nextB)).length;
    const mid = b + binWidthMs / 2;
    const normalCount = Math.round(normalPdf(mid) * totalN * binWidthMs);

    bins.push({
      binStartMs: b,
      binEndMs: nextB,
      label: `${fmtSec(b)}-${fmtSec(nextB)}`,
      count,
      normalCount,
    });
  }

  return {
    bins,
    binWidthMs,
    meanMs,
    medianMs,
    stdDevMs,
    minMs,
    maxMs,
  };
}

export interface HourBucket {
  hour: number;
  label: string;
  solveCount: number;
  meanMs: number | null;
  medianMs: number | null;
}

export interface TimeOfDayResult {
  hours: HourBucket[];
  peakHour: number | null;
  peakLabel: string | null;
}

export function computeTimeOfDay(solves: Solve[]): TimeOfDayResult {
  const clean = solves.filter((s) => !s.dnf);
  const byHour = new Map<number, number[]>();
  for (let h = 0; h < 24; h++) {
    byHour.set(h, []);
  }

  for (const s of clean) {
    const d = new Date(s.dateSec * 1000);
    const h = d.getHours();
    byHour.get(h)!.push(s.timeMs);
  }

  const hours: HourBucket[] = [];
  let bestMedian = Infinity;
  let peakHour: number | null = null;
  let peakLabel: string | null = null;

  for (let h = 0; h < 24; h++) {
    const times = byHour.get(h)!;
    const label = `${String(h).padStart(2, "0")}:00`;
    if (times.length === 0) {
      hours.push({ hour: h, label, solveCount: 0, meanMs: null, medianMs: null });
      continue;
    }
    const meanMs = times.reduce((a, b) => a + b, 0) / times.length;
    const medMs = median(times)!;
    hours.push({
      hour: h,
      label,
      solveCount: times.length,
      meanMs,
      medianMs: medMs,
    });

    if (times.length >= 3 && medMs < bestMedian) {
      bestMedian = medMs;
      peakHour = h;
      peakLabel = `${String(h).padStart(2, "0")}:00-${String((h + 1) % 24).padStart(2, "0")}:00`;
    }
  }

  return { hours, peakHour, peakLabel };
}

export interface SessionComparisonItem {
  key: string;
  name: string;
  solveCount: number;
  cleanCount: number;
  dnfCount: number;
  meanMs: number | null;
  medianMs: number | null;
  bestSingleMs: number | null;
  bestAo5Ms: number | null;
  bestAo12Ms: number | null;
  rCv: number | null;
  firstDateSec: number;
  lastDateSec: number;
}

export function compareSessions(sessions: ParsedSession[]): SessionComparisonItem[] {
  return sessions.map((s) => {
    const clean = s.solves.filter((sv) => !sv.dnf);
    const times = clean.map((sv) => sv.timeMs);
    const meanMs = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : null;
    const medMs = median(times);
    const bestSingleMs = times.length > 0 ? Math.min(...times) : null;
    const rCv = times.length >= 3 ? madCv(times) : null;

    const getBestAo = (n: number) => {
      if (clean.length < n) return null;
      let min = Infinity;
      for (let i = 0; i <= clean.length - n; i++) {
        const slice = clean.slice(i, i + n).map((x) => x.timeMs);
        slice.sort((a, b) => a - b);
        slice.shift();
        slice.pop();
        const m = slice.reduce((a, b) => a + b, 0) / slice.length;
        if (m < min) min = m;
      }
      return min === Infinity ? null : min;
    };

    return {
      key: s.meta.key,
      name: s.meta.name || s.meta.key,
      solveCount: s.solves.length,
      cleanCount: clean.length,
      dnfCount: s.solves.length - clean.length,
      meanMs,
      medianMs: medMs,
      bestSingleMs,
      bestAo5Ms: getBestAo(5),
      bestAo12Ms: getBestAo(12),
      rCv,
      firstDateSec: s.meta.firstDateSec,
      lastDateSec: s.meta.lastDateSec,
    };
  });
}
