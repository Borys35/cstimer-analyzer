import type { ScoredAnalysis } from "./stats";
import { fmtTime } from "./stats";
import type { SplitStats } from "./splits";
import { PHASE_LABELS, REFERENCE_SHARES } from "./splits";

export type Axis = "Improvement" | "Consistency" | "Frequency";

export interface Drill {
  name: string;
  why: string;
}

export interface Prescription {
  diagnosis: string;
  drills: Drill[];
  estimate: string;
  leverage: "high" | "medium" | "low";
}

export type LevelBand = "30s+" | "20-30s" | "13-20s" | "sub-13" | "generic";

export function bandFor(event: string, currentLevelMs: number): LevelBand {
  if (event !== "3x3") return "generic";
  if (currentLevelMs >= 30000) return "30s+";
  if (currentLevelMs >= 20000) return "20-30s";
  if (currentLevelMs >= 13000) return "13-20s";
  return "sub-13";
}

const PAR_CV = 0.1;

export interface PrescriptionEvidence {
  analysis: ScoredAnalysis;
  last50Times: number[];
  splits: SplitStats;
  event: string;
}

export function weakestAxis(a: ScoredAnalysis): Axis {
  const s = a.subscores;
  if (s.improvement != null && s.consistency != null) {
    if (s.improvement <= s.consistency && s.improvement <= s.frequency) return "Improvement";
    if (s.consistency <= s.frequency) return "Consistency";
    return "Frequency";
  }
  if (s.improvement == null && (s.consistency == null || s.consistency <= s.frequency)) {
    return s.consistency == null ? "Frequency" : "Consistency";
  }
  return "Frequency";
}

function bestQuartileMean(times: number[]): number {
  const sorted = [...times].sort((x, y) => x - y);
  const q = Math.max(1, Math.ceil(sorted.length / 4));
  const top = sorted.slice(0, q);
  return top.reduce((acc, v) => acc + v, 0) / top.length;
}

function consistencyEstimate(e: PrescriptionEvidence): string {
  const t = e.last50Times;
  const mean = t.reduce((a, b) => a + b, 0) / t.length;
  const q1 = bestQuartileMean(t);
  const gap = mean - q1;
  const cv = e.analysis.consistencyCv ?? NaN;
  const excessCost = Math.max((cv - PAR_CV) * mean, 0);
  return `Your average sits ${fmtTime(gap)} above your own best-quartile solves. Pulling CV from ${(cv * 100).toFixed(0)}% down to ${PAR_CV * 100}% removes ~${fmtTime(excessCost)} of pure spread cost from every solve.`;
}

function improvementEstimate(e: PrescriptionEvidence): string {
  const a = e.analysis;
  if (!a.trend || a.currentLevelMs == null) return "";
  const horizonWeeks = 8;
  const atCurrent = a.trend.endLevelMs + a.trend.slopeMsPerDay * 7 * horizonWeeks;
  const parSlope = -(a.currentLevelMs * 0.01) / 7;
  const atPar = a.trend.endLevelMs + parSlope * 7 * horizonWeeks;
  const delta = Math.max(atCurrent - atPar, 0);
  return `Holding your pace for 8 weeks lands at ~${fmtTime(Math.max(atCurrent, 500))}; lifting it to −1%/week lands at ~${fmtTime(Math.max(atPar, 500))} — a ${fmtTime(delta)} difference you are leaving on the table.`;
}

function frequencyEstimate(e: PrescriptionEvidence): string {
  const f = e.analysis.freq;
  const daysShort = Math.max(11 - f.activeDays, 0);
  if (daysShort === 0)
    return `Volume is in the top band; expected gain comes from quality, not more days.`;
  const extraSolves = daysShort * Math.round(f.solvesPerActiveDay);
  return `Adding ${daysShort} active days/fortnight ≈ +${extraSolves} solves per fortnight into the dose where improvement compounds.`;
}

function splitLine(e: PrescriptionEvidence): string {
  if (!e.splits.shares || !e.splits.worst || e.event !== "3x3") return "";
  const w = e.splits.worst;
  if (w.shareGap <= 0.02) return "";
  return `Split evidence: ` + PHASE_LABELS[w.phase] + ` consumes ` + (e.splits.shares[w.phase] * 100).toFixed(0) + `% of your solve vs typical ` + (REFERENCE_SHARES[w.phase] * 100).toFixed(0) + `%; the excess is worth ~` + fmtTime(w.excessMs) + `.`;
}

type Cell = (e: PrescriptionEvidence) => Prescription;

const CELLS: Record<Exclude<LevelBand, "generic">, Record<Axis, Cell>> = {
  "30s+": {
    Improvement: (e) => ({
      diagnosis: "At 30s+, seconds hide in unstructured solving, not talent.",
      drills: [
        { name: "Full cross plan on inspection, every solve", why: "Unplanned crosses cost 2-4s and start F2L with a pause." },
        { name: "3 untimed reconstructions per session", why: "Writing down your solution exposes wasteful moves that timed solving hides." },
        { name: "Learn 2-look last layer if not known", why: "Sub-30 requires it; algorithmic phases are the cheapest time you will ever buy." },
      ],
      estimate: improvementEstimate(e),
      leverage: "high",
    }),
    Consistency: (e) => ({
      diagnosis: "Spread at this level is usually pauses during F2L search.",
      drills: [
        { name: "Metronome F2L: one turn per beat, no pauses", why: "Forces continuous lookahead; pauses are the main source of outliers here." },
        { name: "Slow solve to strict 15s cap", why: "Trains uninterrupted recognition instead of burst-and-search habits." },
      ],
      estimate: consistencyEstimate(e),
      leverage: "high",
    }),
    Frequency: (e) => ({
      diagnosis: "Skill is built by daily contact, not weekend marathons.",
      drills: [
        { name: "Fixed daily 20-solve block", why: "Small daily volume beats one long weekly grind for retention." },
        { name: "Track streak, not totals", why: "A visible streak counters skipped days better than motivation." },
      ],
      estimate: frequencyEstimate(e),
      leverage: "high",
    }),
  },
  "20-30s": {
    Improvement: (e) => ({
      diagnosis: "This plateau is F2L efficiency and lookahead, almost never turning speed.",
      drills: [
        { name: "Cross-to-first-pair planning", why: `The transition after cross is the most common multi-second stall. ${splitLine(e)}` },
        { name: "Untimed F2L reconstruction of worst solve daily", why: "Finds the 8-move solutions your hands default past under time pressure." },
        { name: "Back-slot inserts only for one session", why: "Removes cube rotations and regrips that silently add seconds." },
      ],
      estimate: improvementEstimate(e),
      leverage: "high",
    }),
    Consistency: (e) => ({
      diagnosis: "Outliers here come from recognition failures, not slow fingers.",
      drills: [
        { name: "No-look last-layer recognition", why: "Instant OLL/PLL identification removes the longest single pauses." },
        { name: "Count pauses aloud during 10 solves", why: "You cannot fix a pause you do not notice; counting makes them loud." },
      ],
      estimate: consistencyEstimate(e),
      leverage: "high",
    }),
    Frequency: (e) => ({
      diagnosis: "Enough days to improve, not enough to compound.",
      drills: [
        { name: "Two fixed sessions daily: 15 solves each", why: "Anchored sessions survive bad days; vague plans do not." },
        { name: "One Ao25 per session, logged", why: "Comparable numbers turn practice into feedback." },
      ],
      estimate: frequencyEstimate(e),
      leverage: "medium",
    }),
  },
  "13-20s": {
    Improvement: (e) => ({
      diagnosis: "Gains now come from efficiency margins: cross solutions, pair economy, alg choice.",
      drills: [
        { name: "Daily cross sprint: 10 scrambles, plan in 8s", why: "Advanced crosses are planned under pressure, not hoped for." },
        { name: "Rebuild one full solve with movecount audit", why: "Above 55 moves HTM there is real F2L waste to cut. " + splitLine(e) },
        { name: "Drill your 5 worst PLLs by own timing", why: "Personalized alg weakness is cheaper than general speed." },
      ],
      estimate: improvementEstimate(e),
      leverage: "high",
    }),
    Consistency: (e) => ({
      diagnosis: "At this level spread reflects TPS control and reset discipline.",
      drills: [
        { name: "TPS ceiling drill: solve at 80% max turns", why: "Lockups from over-speed create your worst solves." },
        { name: "Warm-up protocol before timing", why: "First-solve outliers drag averages and distort trend data." },
      ],
      estimate: consistencyEstimate(e),
      leverage: "medium",
    }),
    Frequency: (e) => ({
      diagnosis: "Plateau risk scales with routine monotony.",
      drills: [
        { name: "Alternate measured days and experiment days", why: "Experiment days (new algs, slow solving) feed long-term speed without wrecking trend data." },
        { name: "Weekly comp-style Ao5 under pressure", why: "Competition nerves cost real seconds; rehearse them." },
      ],
      estimate: frequencyEstimate(e),
      leverage: "medium",
    }),
  },
  "sub-13": {
    Improvement: (e) => ({
      diagnosis: "Margins are milliseconds: no regrips, no AUF hesitations, zero unplanned moves.",
      drills: [
        { name: "Full-color neutrality trial week", why: "Cross color choice can be worth tenths across thousands of solves." },
        { name: "1-hour alg triage: swap your slowest cases", why: "At sub-13, two bad algs are measurable. " + splitLine(e) },
        { name: "Blind cross+pair 1 execution", why: "Planning depth beyond pair one separates sub-11 from sub-13." },
      ],
      estimate: improvementEstimate(e),
      leverage: "medium",
    }),
    Consistency: (e) => ({
      diagnosis: "Your floor is set by hardware handling under adrenaline.",
      drills: [
        { name: "Edge-grip consistency checks between solves", why: "Micro-regrips mid-alg are invisible at home and fatal at comp." },
        { name: "Ao100 review: flag any solve >1.5x mean", why: "At this level outliers have specific, fixable causes." },
      ],
      estimate: consistencyEstimate(e),
      leverage: "medium",
    }),
    Frequency: (e) => ({
      diagnosis: "More volume without intent now actively cements flaws.",
      drills: [
        { name: "Quality gate: only counted solves with clean execution", why: "Mindless reps automate errors as strongly as skills." },
        { name: "Scheduled rest before competitions", why: "Fresh nervous system, faster recognition; burnout is measurable here." },
      ],
      estimate: frequencyEstimate(e),
      leverage: "low",
    }),
  },
};

const GENERIC: Record<Axis, Cell> = {
  Improvement: (e) => ({
    diagnosis: "Trend is flat or negative; event-specific coaching is not yet built.",
    drills: [
      { name: "Dedicate sessions to deliberate slow solving", why: "Works on every event: remove pauses before adding speed." },
    ],
    estimate: improvementEstimate(e),
    leverage: "medium",
  }),
  Consistency: (e) => ({
    diagnosis: "Spread above par; generic remedy applies to all events.",
    drills: [{ name: "Metronome-paced solves", why: "Uniform pacing is event-independent outlier suppression." }],
    estimate: consistencyEstimate(e),
    leverage: "medium",
  }),
  Frequency: (e) => ({
    diagnosis: "Not enough contact days for this event.",
    drills: [{ name: "Fixed short daily session", why: "Frequency is the universal lever." }],
    estimate: frequencyEstimate(e),
    leverage: "medium",
  }),
};

export function prescribe(axis: Axis, e: PrescriptionEvidence): Prescription {
  const band = bandFor(e.event, e.analysis.currentLevelMs ?? 0);
  const cell = band === "generic" ? GENERIC[axis] : CELLS[band][axis];
  return cell(e);
}
