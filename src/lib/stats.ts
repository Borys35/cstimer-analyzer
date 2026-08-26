import type { Solve } from "./types";

export type RangeKey = "all" | "7" | "30" | "90";
export type BucketMode = "day" | "week";

export const RANGE_MS: Record<Exclude<RangeKey, "all">, number> = {
  "7": 7 * 86400_000,
  "30": 30 * 86400_000,
  "90": 90 * 86400_000,
};

export function filterByRange(solves: Solve[], range: RangeKey, nowMs = Date.now()): Solve[] {
  if (range === "all") return solves;
  const cutoff = nowMs - RANGE_MS[range];
  return solves.filter((s) => s.dateSec * 1000 >= cutoff);
}

export interface JunkSplit {
  kept: Solve[];
  junk: Solve[];
}

export function separateJunk(solves: Solve[]): JunkSplit {
  const clean = solves.filter((s) => !s.dnf);
  if (clean.length < 5) return { kept: solves, junk: [] };
  const sorted = [...clean.map((s) => s.timeMs)].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const cap = Math.max(Math.min(median * 10, 300_000), 30_000);
  const isJunk = (s: Solve) => s.timeMs > cap;
  return {
    kept: solves.filter((s) => !isJunk(s)),
    junk: solves.filter(isJunk),
  };
}

export function rollingAverage(solves: Solve[], n: number): { t: number; ms: number }[] {
  const out: { t: number; ms: number }[] = [];
  let sum = 0;
  const window: number[] = [];
  for (let i = 0; i < solves.length; i++) {
    window.push(solves[i].timeMs);
    sum += solves[i].timeMs;
    if (window.length > n) sum -= window.shift() as number;
    if (window.length === n) out.push({ t: solves[i].dateSec * 1000, ms: sum / n });
  }
  return out;
}

export interface DayBucket {
  dayStartMs: number;
  meanMs: number;
  count: number;
}

export function dailyBuckets(solves: Solve[]): DayBucket[] {
  const map = new Map<number, { total: number; count: number }>();
  for (const s of solves) {
    const d = new Date(s.dateSec * 1000);
    const key = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    const e = map.get(key);
    if (e) {
      e.total += s.timeMs;
      e.count++;
    } else {
      map.set(key, { total: s.timeMs, count: 1 });
    }
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([dayStartMs, e]) => ({ dayStartMs, meanMs: e.total / e.count, count: e.count }));
}

export interface WeekBucket {
  weekStartMs: number;
  meanMs: number;
  count: number;
}

function startOfUTCWeek(ms: number): number {
  const d = new Date(ms);
  const day = (d.getUTCDay() + 6) % 7;
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day);
}

export function weeklyBuckets(solves: Solve[]): WeekBucket[] {
  const map = new Map<number, { total: number; count: number }>();
  for (const s of solves) {
    const key = startOfUTCWeek(s.dateSec * 1000);
    const e = map.get(key);
    if (e) {
      e.total += s.timeMs;
      e.count++;
    } else {
      map.set(key, { total: s.timeMs, count: 1 });
    }
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([weekStartMs, e]) => ({ weekStartMs, meanMs: e.total / e.count, count: e.count }));
}

export interface TrendFit {
  slopeMsPerDay: number;
  interceptMs: number;
  endLevelMs: number;
  weeksCovered: number;
}

export function fitDailyTrend(days: DayBucket[]): TrendFit | null {
  if (days.length < 4) return null;
  const t0 = days[0].dayStartMs;
  let sw = 0,
    sx = 0,
    sy = 0,
    sxx = 0,
    sxy = 0;
  for (const d of days) {
    const x = (d.dayStartMs - t0) / 86400_000;
    const w = d.count;
    sw += w;
    sx += w * x;
    sy += w * d.meanMs;
    sxx += w * x * x;
    sxy += w * x * d.meanMs;
  }
  const denom = sw * sxx - sx * sx;
  if (denom <= 0) return null;
  const slope = (sw * sxy - sx * sy) / denom;
  const intercept = (sy - slope * sx) / sw;
  const lastX = (days[days.length - 1].dayStartMs - t0) / 86400_000;
  const weeksCovered = lastX / 7;
  return {
    slopeMsPerDay: slope,
    interceptMs: intercept,
    endLevelMs: intercept + slope * lastX,
    weeksCovered,
  };
}

function piecewise(x: number, anchors: [number, number][]): number {
  if (x <= anchors[0][0]) return anchors[0][1];
  const last = anchors[anchors.length - 1];
  if (x >= last[0]) return last[1];
  for (let i = 0; i < anchors.length - 1; i++) {
    const [x0, y0] = anchors[i];
    const [x1, y1] = anchors[i + 1];
    if (x <= x1) return Math.round(y0 + ((x - x0) / (x1 - x0)) * (y1 - y0));
  }
  return last[1];
}

export function improvementScore(trend: TrendFit | null, currentLevelMs: number): number | null {
  if (!trend || trend.weeksCovered < 2 || currentLevelMs <= 0) return null;
  const pctPerWeek = (-trend.slopeMsPerDay * 7 * 100) / currentLevelMs;
  return piecewise(pctPerWeek, [
    [-5, 0],
    [-0.5, 10],
    [0, 22],
    [0.3, 35],
    [0.7, 60],
    [1.5, 85],
    [3, 96],
  ]);
}

export function consistencyScore(last50: number[]): number | null {
  if (last50.length < 10) return null;
  const mean = last50.reduce((a, b) => a + b, 0) / last50.length;
  const variance = last50.reduce((a, b) => a + (b - mean) ** 2, 0) / last50.length;
  const cv = Math.sqrt(variance) / mean;
  return piecewise(cv, [
    [0.04, 100],
    [0.07, 90],
    [0.09, 75],
    [0.12, 55],
    [0.15, 40],
    [0.25, 20],
    [0.45, 0],
  ]);
}

export function coefficientOfVariation(times: number[]): number {
  if (times.length === 0) return NaN;
  const mean = times.reduce((a, b) => a + b, 0) / times.length;
  const variance = times.reduce((a, b) => a + (b - mean) ** 2, 0) / times.length;
  return Math.sqrt(variance) / mean;
}

export interface FrequencyResult {
  activeDays: number;
  solvesPerActiveDay: number;
}

export function frequencyStats(allSolvesOfType: Solve[], nowMs = Date.now()): FrequencyResult {
  const cutoff = nowMs - 14 * 86400_000;
  const daySet = new Set<number>();
  let count = 0;
  for (const s of allSolvesOfType) {
    if (s.dateSec * 1000 < cutoff) continue;
    daySet.add(Math.floor(s.dateSec / 86400));
    count++;
  }
  const activeDays = daySet.size;
  return {
    activeDays,
    solvesPerActiveDay: activeDays > 0 ? count / activeDays : 0,
  };
}

export function frequencyScore(f: FrequencyResult): number {
  const dayPart = piecewise(f.activeDays, [
    [0, 0],
    [2, 20],
    [5, 50],
    [10, 85],
    [11, 90],
    [14, 100],
  ]);
  const volPart = piecewise(f.solvesPerActiveDay, [
    [0, 0],
    [10, 30],
    [20, 60],
    [50, 90],
    [100, 100],
    [200, 100],
  ]);
  return Math.round(dayPart * 0.7 + volPart * 0.3);
}

export interface SubScores {
  improvement: number | null;
  consistency: number | null;
  frequency: number;
}

export interface ScoredAnalysis {
  subscores: SubScores;
  headline: number | null;
  tier: "good" | "decent" | "bad" | "horrible" | null;
  currentLevelMs: number | null;
  trend: TrendFit | null;
  consistencyCv: number | null;
  freq: FrequencyResult;
  lastNTimes: number[];
  days: DayBucket[];
}

const W_IMPROVEMENT = 0.4;
const W_CONSISTENCY = 0.3;
const W_FREQUENCY = 0.3;

export function tierFor(score: number): ScoredAnalysis["tier"] {
  if (score >= 80) return "good";
  if (score >= 60) return "decent";
  if (score >= 40) return "bad";
  return "horrible";
}

export interface AnalyzeInput {
  rangedClean: Solve[];
  allClean: Solve[];
  nowMs?: number;
}

export const LAST_N = 50;

export function pctPerWeek(trend: TrendFit, currentLevelMs: number): number {
  return (-trend.slopeMsPerDay * 7 * 100) / currentLevelMs;
}

export function analyze(input: AnalyzeInput): ScoredAnalysis {
  const { rangedClean, allClean } = input;
  const days = dailyBuckets(rangedClean);
  const trend = fitDailyTrend(days);

  const lastN = rangedClean.slice(-LAST_N).map((s) => s.timeMs);
  const currentLevelMs =
    lastN.length > 0 ? lastN.reduce((a, b) => a + b, 0) / lastN.length : null;

  const improvement = improvementScore(trend, currentLevelMs ?? 0);
  const consistency = consistencyScore(lastN);
  const freq = frequencyStats(allClean, input.nowMs ?? Date.now());
  const frequency = frequencyScore(freq);

  if (rangedClean.length === 0) {
    return {
      subscores: { improvement: null, consistency: null, frequency },
      headline: null,
      tier: null,
      currentLevelMs,
      trend,
      consistencyCv: null,
      freq,
      lastNTimes: lastN,
      days,
    };
  }

  let headline: number | null = null;
  let tw = W_IMPROVEMENT * (improvement != null ? 1 : 0);
  let cw = W_CONSISTENCY * (consistency != null ? 1 : 0);
  let fw = W_FREQUENCY;
  const totalW = tw + cw + fw;
  if (totalW > 0) {
    const acc =
      (improvement ?? 0) * tw +
      (consistency ?? 0) * cw +
      frequency * fw;
    headline = Math.round(acc / totalW);
  }

  return {
    subscores: { improvement, consistency, frequency },
    headline,
    tier: headline != null ? tierFor(headline) : null,
    currentLevelMs,
    trend,
    consistencyCv: lastN.length >= 10 ? coefficientOfVariation(lastN) : null,
    freq,
    lastNTimes: lastN,
    days,
  };
}

export interface ProjectionPoint {
  t: number;
  ms: number;
}

export function trendPoints(trend: TrendFit | null, days: DayBucket[]): ProjectionPoint[] {
  if (!trend || days.length === 0) return [];
  const t0 = days[0].dayStartMs;
  const tEnd = days[days.length - 1].dayStartMs;
  const pts: ProjectionPoint[] = [];
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    const t = t0 + ((tEnd - t0) / steps) * i;
    const x = (t - t0) / 86400_000;
    pts.push({ t, ms: trend.interceptMs + trend.slopeMsPerDay * x });
  }
  return pts;
}

export function projectForward(
  trend: TrendFit | null,
  lastDateMs: number,
  horizonWeeks: number,
): ProjectionPoint[] {
  if (!trend || trend.weeksCovered < 2) return [];
  const pts: ProjectionPoint[] = [];
  const steps = 12;
  for (let i = 0; i <= steps; i++) {
    const t = lastDateMs + (i / steps) * horizonWeeks * 7 * 86400_000;
    const ms = trend.endLevelMs + trend.slopeMsPerDay * ((i / steps) * horizonWeeks * 7);
    pts.push({ t, ms: Math.max(ms, 500) });
  }
  return pts;
}

export function fmtTime(ms: number): string {
  if (ms >= 60000) {
    const m = Math.floor(ms / 60000);
    const s = (ms % 60000) / 1000;
    return `${m}:${s.toFixed(2).padStart(5, "0")}`;
  }
  return `${(ms / 1000).toFixed(2)}`;
}
