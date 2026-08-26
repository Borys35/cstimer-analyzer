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

export type LevelBand = "sub-60" | "30s+" | "20-30s" | "13-20s" | "sub-13" | "generic";

export function bandFor(event: string, currentLevelMs: number): LevelBand {
  if (event !== "3x3") return "generic";
  if (currentLevelMs >= 60000) return "sub-60";
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

export function consistencyEstimate(e: PrescriptionEvidence): string {
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

type CellContent = Omit<Prescription, "estimate">;
type Cell = (e: PrescriptionEvidence) => CellContent;

const CELLS: Record<Exclude<LevelBand, "generic">, Record<Axis, Cell>> = {
  "sub-60": {
    Improvement: (e) => ({
      diagnosis: "At sub-60, the biggest gains come from switching to CFOP and learning intuitive F2L. Method efficiency is the #1 bottleneck.",
      drills: [
        { name: "Cross-on-bottom practice — plan cross on bottom, execute without looking at cross pieces", why: "Top-cross habit is the #1 time-waster at this level; it blocks F2L transition. Source: Zubin Park sub-50 section, J Perm cross tutorial." },
        { name: "F2L pair insertion (untimed) — take scrambled cube, solve one F2L pair only, reset, repeat", why: "Builds intuitive F2L without time pressure. Eliminates beginner layer-by-layer. Source: TheCubicle guide, CuberPal practice guide." },
        { name: "Learn 2-look OLL and 2-look PLL if not known", why: "Sub-60 requires algorithmic last layer; this is the cheapest time you will ever buy. Source: AI Cube Trainer FAQ, Zubin Park sub-50 section." },
      ],
      leverage: "high",
    }),
    Consistency: (e) => ({
      diagnosis: "At sub-60, wide spread is normal — not a priority. Focus on method first.",
      drills: [
        { name: "Finger trick drill — practice double-flicks for U2, M2; R/U triggers slowly", why: "Builds mechanical foundation; inconsistent finger tricks cause random pauses. Source: J Perm finger tricks video." },
        { name: "Slow solve with no pauses — solve at half speed, never stop turning", why: "Trains continuous execution instead of burst-and-search. Source: CuberPal practice guide." },
      ],
      leverage: "low",
    }),
    Frequency: (e) => ({
      diagnosis: "At sub-60, skill is built by daily contact, not weekend marathons. 3–5 sessions/week (20–30 min) is the target.",
      drills: [
        { name: "Fixed daily 20-solve block — small daily volume beats one long grind", why: "Retention compounds with frequency. Sub-60 → sub-40 takes 2–4 weeks with consistent practice. Source: AI Cube Trainer FAQ." },
        { name: "Track streak, not totals — a visible streak counters skipped days", why: "Habit formation matters more than raw volume at this stage." },
      ],
      leverage: "high",
    }),
  },
  "30s+": {
    Improvement: (e) => ({
      diagnosis: "At 30s+, seconds hide in unstructured solving. F2L efficiency and 2-look last layer are the biggest levers.",
      drills: [
        { name: "Full cross plan on inspection, every solve", why: "Unplanned crosses cost 2-4s and start F2L with a pause." },
        { name: "3 untimed reconstructions per session", why: "Writing down your solution exposes wasteful moves that timed solving hides." },
        { name: "Drill 2-look OLL/PLL algs to automaticity — repeat each alg 20 times per session", why: "Algorithmic last layer is the cheapest time you will ever buy. Source: Zubin Park sub-40 section." },
      ],
      leverage: "high",
    }),
    Consistency: (e) => ({
      diagnosis: "Spread at this level is usually pauses during F2L search and inconsistent last-layer recognition.",
      drills: [
        { name: "Metronome F2L: one turn per beat, no pauses", why: "Forces continuous lookahead; pauses are the main source of outliers here." },
        { name: "No-look last-layer recognition — flash OLL/PLL case, name it, execute", why: "Instant recognition removes the longest single pauses. Source: CuberPal spaced-repetition practice." },
      ],
      leverage: "high",
    }),
    Frequency: (e) => ({
      diagnosis: "Enough days to improve, but 100 solves/day is the volume target if you want to advance. Source: Zubin Park sub-40 section.",
      drills: [
        { name: "100-solve session — timed, track Ao100, note biggest pauses", why: "Builds consistency and volume; identifies your biggest time sinks. Source: Zubin Park." },
        { name: "One Ao25 per session, logged", why: "Comparable numbers turn practice into feedback." },
      ],
      leverage: "medium",
    }),
  },
  "20-30s": {
    Improvement: (e) => ({
      diagnosis: "This plateau is F2L efficiency and cross-F2L transition. Lookahead is the next lever.",
      drills: [
        { name: "Cross + 1 (C+1): plan cross AND first F2L pair during inspection, execute both without looking", why: "The transition after cross is the most common multi-second stall. Source: Caiden Lee coaching, SpeedSolving training thread. " + splitLine(e) },
        { name: "Slow solve with lookahead — solve at 50% speed, never pause, track next pair continuously", why: "Builds F2L lookahead, the primary bottleneck between sub-25 and sub-20. Source: CuberPal F2L lookahead guide." },
        { name: "Back-slot inserts only for one session — solve pairs into back slots (R/U/L moves, no rotations)", why: "Removes cube rotations and regrips that silently add seconds. Source: Zubin Park sub-20 section." },
      ],
      leverage: "high",
    }),
    Consistency: (e) => ({
      diagnosis: "Outliers here come from recognition failures and inconsistent F2L solutions.",
      drills: [
        { name: "Full PLL drill — random PLL case, target < 2.5 sec execution", why: "At this level, full PLL should be automatic. Weak PLLs cause multi-second pauses. Source: J Perm PLL trainer." },
        { name: "Count pauses aloud during 10 solves", why: "You cannot fix a pause you do not notice; counting makes them loud." },
        { name: "Cross inspection drill — 15 sec inspection, plan entire cross, no turning", why: "Unplanned crosses cause cascading pauses through F2L. Source: CuberPal cross inspection trainer." },
      ],
      leverage: "high",
    }),
    Frequency: (e) => ({
      diagnosis: "5–7 sessions/week (30–60 min) is the target; structured sessions beat volume.",
      drills: [
        { name: "Two fixed sessions daily: 15 solves each", why: "Anchored sessions survive bad days; vague plans do not." },
        { name: "Weekly comp-style Ao5 under pressure", why: "Competition nerves cost real seconds; rehearse them. Source: CuberPal practice guide." },
      ],
      leverage: "medium",
    }),
  },
  "13-20s": {
    Improvement: (e) => ({
      diagnosis: "Gains now come from efficiency margins: cross solutions, pair economy, alg choice. TPS matters less than you think.",
      drills: [
        { name: "Daily cross sprint: 10 scrambles, plan in 8 sec, target sub-2 sec execution", why: "Advanced crosses are planned under pressure, not hoped for. Source: SpeedSolving training thread." },
        { name: "OLL recognition trainer — flash all 57 cases, target < 1 sec recognition", why: "OLL pause is the easiest multi-second gain at this level. Source: J Perm OLL trainer." },
        { name: "Drill your 5 worst PLLs by own timing", why: "Personalized alg weakness is cheaper than general speed. " + splitLine(e) },
      ],
      leverage: "high",
    }),
    Consistency: (e) => ({
      diagnosis: "At this level spread reflects TPS control, regrip discipline, and warm-up habits.",
      drills: [
        { name: "Metronome F2L — solve F2L to a metronome at ~200 BPM, increasing over sessions", why: "Continuous turning at speed; eliminates micro-pauses. Source: SpeedSolving training thread (2013)." },
        { name: "Warm-up protocol before timing — 5 untimed solves, focus on smooth execution", why: "First-solve outliers drag averages and distort trend data." },
        { name: "COLL/WV learning — drill 2–3 cases per session", why: "Last-slot optimization reduces OLL cases and speeds up F2L→LL transition. Source: Speedcubedb." },
      ],
      leverage: "medium",
    }),
    Frequency: (e) => ({
      diagnosis: "5–7 sessions/week (60–120 min) is standard; fatigue reduces gains past 2 hrs/day.",
      drills: [
        { name: "Alternate measured days and experiment days", why: "Experiment days (new algs, slow solving) feed long-term speed without wrecking trend data." },
        { name: "TPS ramp — 20 solves at comfortable speed, then 10 at max TPS, compare efficiency", why: "Reveals whether you are turning fast or solving fast. Source: Sub-X TPS analysis." },
      ],
      leverage: "medium",
    }),
  },
  "sub-13": {
    Improvement: (e) => ({
      diagnosis: "Margins are milliseconds: no regrips, no AUF hesitations, zero unplanned moves. Consider advanced subsets.",
      drills: [
        { name: "Full-color neutrality trial week — solve on non-dominant cross color", why: "Cross color choice can be worth tenths across thousands of solves. Source: Zubin Park sub-10 section." },
        { name: "1-hour alg triage: swap your slowest cases for better alternatives", why: "At sub-13, two bad algs are measurable. Consider ZBLL subsets (T, U, Pi) if OLL/PLL are fast. " + splitLine(e) },
        { name: "Blind cross+pair 1 execution — plan depth beyond pair one", why: "Planning depth separates sub-11 from sub-13. Source: Caiden Lee C+1 training." },
      ],
      leverage: "medium",
    }),
    Consistency: (e) => ({
      diagnosis: "Your floor is set by hardware handling under adrenaline. Micro-regrips and AUF errors dominate.",
      drills: [
        { name: "Competition simulation — WCA-style inspection (+2/DNF rules), 5-solve Ao5 under pressure", why: "At this level, competition nerves cost real seconds. Source: WCA regulations A3a1." },
        { name: "Ao100 review: flag any solve >1.5x mean, reconstruct to find cause", why: "Outliers have specific, fixable causes at this level. Source: CuberPal solve analysis." },
        { name: "Pseudoslotting practice — intentional D-layer misalignment for creative F2L", why: "Advanced F2L technique that reduces move count. Source: Wikipedia CFOP (Tymon Kolasiński)." },
      ],
      leverage: "medium",
    }),
    Frequency: (e) => ({
      diagnosis: "More volume without intent now actively cements flaws. Quality gate every solve.",
      drills: [
        { name: "Quality gate: only counted solves with clean execution — no lockups, no pauses", why: "Mindless reps automate errors as strongly as skills. Source: AI Cube Trainer FAQ." },
        { name: "Record & review — film 5 solves, analyze pauses, identify micro-stops", why: "What you cannot see, you cannot fix. Source: CuberPal review guidance." },
        { name: "Scheduled rest before competitions — 2–3 days light practice", why: "Fresh nervous system, faster recognition; burnout is measurable here." },
      ],
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
    leverage: "medium",
  }),
  Consistency: (e) => ({
    diagnosis: "Spread above par; generic remedy applies to all events.",
    drills: [{ name: "Metronome-paced solves", why: "Uniform pacing is event-independent outlier suppression." }],
    leverage: "medium",
  }),
  Frequency: (e) => ({
    diagnosis: "Not enough contact days for this event.",
    drills: [{ name: "Fixed short daily session", why: "Frequency is the universal lever." }],
    leverage: "medium",
  }),
};

function selectCell(axis: Axis, e: PrescriptionEvidence): CellContent {
  const band = bandFor(e.event, e.analysis.currentLevelMs ?? 0);
  const cell: Cell = band === "generic" ? GENERIC[axis] : CELLS[band][axis];
  return cell(e);
}

const ESTIMATORS: Record<Axis, (e: PrescriptionEvidence) => string> = {
  Improvement: improvementEstimate,
  Consistency: consistencyEstimate,
  Frequency: frequencyEstimate,
};

export function prescribe(axis: Axis, e: PrescriptionEvidence): Prescription {
  return { ...selectCell(axis, e), estimate: ESTIMATORS[axis](e) };
}

export function drillHint(axis: Axis, e: PrescriptionEvidence): Drill {
  return selectCell(axis, e).drills[0];
}
