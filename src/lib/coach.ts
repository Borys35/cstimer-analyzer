import type { ScoredAnalysis } from "./stats";
import { fmtTime } from "./stats";

export interface FocusItem {
  area: "Improvement" | "Consistency" | "Frequency" | "Data";
  score: number | null;
  text: string;
}

export interface CoachReport {
  verdictTitle: string;
  verdictText: string;
  focus: FocusItem[];
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
  if (msPerWeek <= -50)
    return `You are improving at ${fmtTime(Math.abs(msPerWeek))}/week. Whatever you are doing, keep doing it and add volume.`;
  if (msPerWeek < 0)
    return `Improving, but slowly: ${fmtTime(Math.abs(msPerWeek))}/week. At this rate a 1-second drop takes ${(1000 / Math.abs(msPerWeek)).toFixed(0)} weeks. Pick up the pace or pick up volume.`;
  if (msPerWeek < 50)
    return `Flat. ${fmtTime(Math.abs(msPerWeek))}/week of drift is noise, not progress. You are maintaining, not training.`;
  return `Regressing at ${fmtTime(msPerWeek)}/week. You are actively getting worse. Either your practice is mindless or you are tired. Fix the input before complaining about the output.`;
}

function consistencyText(score: number | null, cv: number | null): string {
  if (score == null || cv == null)
    return "Fewer than 10 clean solves in range. Consistency cannot be judged on that sample.";
  const pct = (cv * 100).toFixed(0);
  if (score >= 85) return `CV ${pct}% — elite spread. Your worst solves would embarrass your average less than most people's.`;
  if (score >= 60) return `CV ${pct}% — acceptable. Your bad solves are still dragging every average down.`;
  if (score >= 30) return `CV ${pct}% — sloppy. You have fast solves in you, and you prove it by failing to reproduce them. Lookahead and pause discipline, not more speed.`;
  return `CV ${pct}% — chaotic. Your times are a lottery. Drill slow, metronomic solves until the spread collapses; speed without repeatability is worthless.`;
}

function frequencyText(a: ScoredAnalysis): string {
  const { activeDays, solvesPerActiveDay } = a.freq;
  if (activeDays === 0)
    return "Zero active days in the last 14. You do not currently practice this event. There is nothing to analyze.";
  if (activeDays <= 2)
    return `${activeDays} active days in 14. This is dabbling, not training. Target at least 5 days/week.`;
  if (activeDays <= 4)
    return `${activeDays} active days in 14, ~${solvesPerActiveDay.toFixed(0)} solves per day. Below the dose where improvement compounds. Add sessions, not just length.`;
  return `${activeDays} active days in 14, ~${solvesPerActiveDay.toFixed(0)} solves/day. Volume is adequate. If results are still flat, quality is the problem, not quantity.`;
}

function dataText(): string {
  return "Some scores are missing because the selected window is too thin. Widen the range or upload more history.";
}

export function buildCoachReport(a: ScoredAnalysis, puzzleLabel: string): CoachReport {
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

  const title = a.tier ? TIER_TITLES[a.tier] : "NO VERDICT YET";
  return { verdictTitle: title, verdictText, focus };
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
