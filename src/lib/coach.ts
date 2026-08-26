import type { ScoredAnalysis } from "./stats";
import { fmtTime } from "./stats";
import { prescribe, weakestAxis, type Axis, type Prescription } from "./prescriptions";
import type { SplitStats } from "./splits";

export interface FocusItem {
  area: Axis | "Data";
  score: number | null;
  text: string;
  prescription?: Prescription;
}

export interface CoachReport {
  verdictTitle: string;
  verdictText: string;
  focus: FocusItem[];
  splitHint: string | null;
}

const TIER_TITLES: Record<NonNullable<ScoredAnalysis["tier"]>, string> = {
  good: "GOOD. Do not get comfortable.",
  decent: "DECENT. That is not a compliment.",
  bad: "BAD. The numbers do not lie.",
  horrible: "HORRIBLE. Stop wasting solves.",
};

function improvementText(score: number | null, a: ScoredAnalysis): string {
  if (score == null || !a.trend)
    return "Not enough time-span in this range to establish a trend. Solve more, across more days, then come back.";
  const msPerWeek = a.trend.slopeMsPerDay * 7;
  const pctPerWeek = a.currentLevelMs ? (-msPerWeek * 100) / a.currentLevelMs : 0;
  if (msPerWeek <= -50) {
    if (pctPerWeek > 3)
      return `Improving ${pctPerWeek.toFixed(1)}%/week (${fmtTime(Math.abs(msPerWeek))}/week). Above 3%/week sustained is beginner territory or a fluke window; expect it to stall. Bank it while it lasts.`;
    return `You are improving at ${fmtTime(Math.abs(msPerWeek))}/week (~${pctPerWeek.toFixed(1)}%/week). Long-run data says sustained −0.3 to −0.45%/week is realistic at your stage; anything above −1.5%/week for months puts you ahead of the curve. Keep doing what you are doing and add volume.`;
  }
  if (msPerWeek < 0)
    return `Improving, but slowly: ${fmtTime(Math.abs(msPerWeek))}/week. Median cubers plateau within ~4 years because this rate decays toward zero. Pick up deliberate practice before the curve does it for you.`;
  if (msPerWeek < 50)
    return `Flat. ${fmtTime(Math.abs(msPerWeek))}/week of drift is noise, not progress. Most cubers who quit effectively stopped here — maintaining feels like training but scores like standing still.`;
  return `Regressing at ${fmtTime(msPerWeek)}/week. You are actively getting worse. Either your practice is mindless or you are tired. Fix the input before complaining about the output.`;
}

function consistencyText(score: number | null, cv: number | null): string {
  if (score == null || cv == null)
    return "Fewer than 10 clean solves in range. Consistency cannot be judged on that sample.";
  const pct = (cv * 100).toFixed(0);
  if (cv < 0.04)
    return `CV ${pct}% — implausibly tight for raw singles. Check that your log is real solves, not repeated averages.`;
  if (score >= 88) return `CV ${pct}% — genuinely tight; measured logs rarely sit below 9% regardless of level. This is top-decile spread.`;
  if (score >= 70) return `CV ${pct}% — above par. Community convention calls <10% good; you are close. Your worst solves still cost your averages.`;
  if (score >= 55) return `CV ${pct}% — par for measured cubers (8–15%). Par is not praise: every point of spread is seconds leaking into your mo5s and mo12s.`;
  if (score >= 40) return `CV ${pct}% — sloppy side of typical. You have fast solves in you and prove it by failing to reproduce them. Lookahead and pause discipline, not more speed.`;
  return `CV ${pct}% — chaotic. Your times are a lottery; measured logs almost never look like this without pauses or careless turning. Drill slow, metronomic solves until the spread collapses.`;
}

function frequencyText(a: ScoredAnalysis): string {
  const { activeDays, solvesPerActiveDay } = a.freq;
  if (activeDays === 0)
    return "Zero active days in the last 14. You do not currently practice this event. There is nothing to analyze.";
  if (activeDays <= 2)
    return `${activeDays} active days in 14. This is dabbling, not training. Self-reported improving cubers train about an hour most days.`;
  if (activeDays <= 5)
    return `${activeDays} active days in 14, ~${solvesPerActiveDay.toFixed(0)} solves per active day. Below the dose where improvement compounds; forum norms put regular improvers at 20–100 solves/day on more days than this.`;
  if (activeDays <= 10)
    return `${activeDays} active days in 14, ~${solvesPerActiveDay.toFixed(0)} solves/day. Workable, but the difference between decent and good is the days you skipped.`;
  return `${activeDays} active days in 14, ~${solvesPerActiveDay.toFixed(0)} solves/day. Volume is adequate. If results are still flat, quality is the problem, not quantity — deliberate practice beats raw count.`;
}

function dataText(): string {
  return "Some scores are missing because the selected window is too thin. Widen the range or upload more history.";
}

export function buildCoachReport(
  a: ScoredAnalysis,
  puzzleLabel: string,
  extras: { last50Times: number[]; splits: SplitStats; event: string },
): CoachReport {
  const level = a.currentLevelMs != null ? fmtTime(a.currentLevelMs) : "unknown";
  let verdictText: string;
  switch (a.tier) {
    case "good":
      verdictText = `Headline ${a.headline}/100 on ${puzzleLabel}. Current level ≈ ${level}. You are doing most things right; the remaining points live in details.`;
      break;
    case "decent":
      verdictText = `Headline ${a.headline}/100 on ${puzzleLabel}. Current level ≈ ${level}. Functional but unremarkable — one weak pillar is capping you, and the breakdown below names it.`;
      break;
    case "bad":
      verdictText = `Headline ${a.headline}/100 on ${puzzleLabel}. Current level ≈ ${level}. This is what plateau looks like from the inside. Read the weakest line below and act on it daily.`;
      break;
    case "horrible":
      verdictText = `Headline ${a.headline}/100 on ${puzzleLabel}. Current level ≈ ${level}. This is not a training program, it is a habit of showing up without intent. Rebuild from the lowest number below.`;
      break;
    default:
      verdictText = "Insufficient data for a verdict. Upload more history or widen the range.";
  }

  const focus: FocusItem[] = [
    { area: "Improvement", score: a.subscores.improvement, text: improvementText(a.subscores.improvement, a) },
    { area: "Consistency", score: a.subscores.consistency, text: consistencyText(a.subscores.consistency, a.consistencyCv) },
    { area: "Frequency", score: a.subscores.frequency, text: frequencyText(a) },
  ];
  if (a.subscores.improvement == null && a.subscores.consistency == null) {
    focus.push({ area: "Data", score: null, text: dataText() });
  }
  focus.sort((x, y) => (x.score ?? -1) - (y.score ?? -1));

  const evidence = {
    analysis: a,
    last50Times: extras.last50Times,
    splits: extras.splits,
    event: extras.event,
  };
  const weak = weakestAxis(a);
  for (const f of focus) {
    if (f.area === weak && f.score != null) {
      f.prescription = prescribe(weak, evidence);
    } else if (f.area !== "Data" && f.score != null) {
      const p2 = prescribe(f.area as Axis, evidence);
      f.text += " " + p2.drills[0].name + ": " + p2.drills[0].why;
    }
  }

  let splitHint: string | null = null;
  if (extras.event === "3x3" && extras.splits.shares == null) {
    splitHint =
      extras.splits.usableCount > 0
        ? `Only ${extras.splits.usableCount} solves carry cross/F2L/OLL/PLL phase marks (need ≥25). Enable cstimer's multi-phase timer and split-specific prescriptions unlock.`
        : "No solves carry cross/F2L/OLL/PLL phase marks. Enable cstimer's multi-phase timer to unlock split-specific prescriptions.";
  }

  const title = a.tier ? TIER_TITLES[a.tier] : "NO VERDICT YET";
  return { verdictTitle: title, verdictText, focus, splitHint };
}

export function projectionSentence(a: ScoredAnalysis, horizonWeeks: number): string | null {
  if (!a.trend || a.trend.weeksCovered < 2 || a.currentLevelMs == null) return null;
  const projected = a.trend.endLevelMs + a.trend.slopeMsPerDay * horizonWeeks * 7;
  if (projected <= 0 || !Number.isFinite(projected))
    return `At this trajectory, ${p(horizonWeeks)} puts you below measurement error. Suspiciously good. Verify the trend holds before framing it.`;
  const dir = a.trend.slopeMsPerDay < 0 ? "keep this pace" : "keep this pace (i.e., keep regressing)";
  return `Projected level in ${horizonWeeks} weeks: ~${fmtTime(Math.max(projected, 500))} if you ${dir}.`;
}

function p(w: number): string {
  return w === 1 ? "1 week" : `${w} weeks`;
}
